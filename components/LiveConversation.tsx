
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Language, Persona, TranscriptionItem } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';

interface LiveConversationProps {
  language: Language;
  persona: Persona;
  onEnd: (transcriptions: TranscriptionItem[]) => void;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ language, persona, onEnd }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [currentText, setCurrentText] = useState<{ user: string, model: string }>({ user: '', model: '' });
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Use refs to accumulate transcription text to avoid stale closures in session callbacks
  const userTranscriptionRef = useRef('');
  const modelTranscriptionRef = useRef('');

  const endSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    
    // Pass local snapshot to avoid state race condition
    onEnd(transcriptions);
  }, [onEnd, transcriptions]);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const systemInstruction = `
          You are ${persona.name}, acting as a ${persona.role}. 
          The user is trying to reconnect with their heritage language: ${language.name}.
          They may feel self-conscious or have "broken" language skills. 
          Be incredibly warm, patient, and encouraging. 
          Correct them gently only if it helps the flow. 
          Respond naturally in ${language.name}. 
          If they use English (code-switching), accept it warmly and reply in ${language.name} with maybe a few English words if needed to bridge understanding.
          Keep responses conversational and not like a teacher.
        `;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setIsConnecting(false);
              setIsListening(true);

              const source = audioContextInRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = createPcmBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextInRef.current!.destination);
            },
            onmessage: async (message) => {
              if (!mounted) return;

              // Handle audio
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64 && audioContextOutRef.current) {
                const outCtx = audioContextOutRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              // Handle Interrupt
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Handle Transcription with refs to prevent stale closure issues
              if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                userTranscriptionRef.current += text;
                setCurrentText(prev => ({ ...prev, user: userTranscriptionRef.current }));
              }
              if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                modelTranscriptionRef.current += text;
                setCurrentText(prev => ({ ...prev, model: modelTranscriptionRef.current }));
              }

              if (message.serverContent?.turnComplete) {
                const finalUserText = userTranscriptionRef.current;
                const finalModelText = modelTranscriptionRef.current;

                // Fix: Explicitly type entries to avoid string literal 'speaker' type error
                setTranscriptions(prev => {
                  const newEntries: TranscriptionItem[] = [];
                  if (finalUserText.trim()) {
                    newEntries.push({ speaker: 'user', text: finalUserText, timestamp: Date.now() });
                  }
                  if (finalModelText.trim()) {
                    newEntries.push({ speaker: 'model', text: finalModelText, timestamp: Date.now() });
                  }
                  return [...prev, ...newEntries];
                });

                // Reset accumulation
                userTranscriptionRef.current = '';
                modelTranscriptionRef.current = '';
                setCurrentText({ user: '', model: '' });
              }
            },
            onerror: (e) => console.error('Live API Error:', e),
            onclose: () => console.log('Live API Closed'),
          },
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error('Failed to start session:', err);
      }
    };

    startSession();

    return () => {
      mounted = false;
    };
  }, [language, persona]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {isConnecting ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#2d5a27] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-serif text-[#5c4033]">Preparing your safe space...</p>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="relative mb-12 flex justify-center items-center">
            {/* Pulsing visualizer */}
            <div className={`absolute w-64 h-64 bg-[#2d5a27]/20 rounded-full transition-all duration-1000 ${isListening ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}></div>
            <div className={`absolute w-48 h-48 bg-[#2d5a27]/30 rounded-full transition-all duration-700 ${isListening ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}></div>
            <div className="relative z-10 w-32 h-32 bg-[#2d5a27] rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-serif text-[#5c4033] mb-2">Speaking with {persona.name}</h2>
          <p className="text-[#c27e5d] font-medium mb-8">Language: {language.name}</p>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-[#d2b48c]/30 min-h-[120px] flex flex-col justify-center">
            {currentText.user && <p className="text-sm text-gray-400 mb-2 italic">You: {currentText.user}</p>}
            {currentText.model ? (
               <p className="text-xl text-[#5c4033] font-medium leading-relaxed">"{currentText.model}"</p>
            ) : (
               <p className="text-lg text-gray-500 italic">Listening to your heart...</p>
            )}
          </div>

          <button
            onClick={endSession}
            className="bg-[#c27e5d] text-white px-10 py-3 rounded-full font-bold hover:bg-[#a6684c] transition-all shadow-md transform hover:-translate-y-1 active:scale-95"
          >
            End Conversation & Reflect
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveConversation;
