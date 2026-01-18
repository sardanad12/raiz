import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Language, Persona, TranscriptionItem, ProficiencyLevel, IdentityProfile } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';

interface LiveConversationProps {
  language: Language;
  persona: Persona;
  identity: IdentityProfile;
  customPrompt?: string | null;
  onEnd: (transcriptions: TranscriptionItem[]) => void;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ language, persona, identity, customPrompt, onEnd }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [currentText, setCurrentText] = useState<{ user: string, model: string }>({ user: '', model: '' });
  const [userTranslation, setUserTranslation] = useState<string>('');
  
  const [proficiencyScore, setProficiencyScore] = useState(30);
  const [currentLevel, setCurrentLevel] = useState<ProficiencyLevel>('Beginner');
  const [levelUpNotif, setLevelUpNotif] = useState(false);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const journalRef = useRef<HTMLDivElement>(null);

  const userTranscriptionRef = useRef('');
  const modelTranscriptionRef = useRef('');

  useEffect(() => {
    if (journalRef.current) {
      journalRef.current.scrollTop = journalRef.current.scrollHeight;
    }
  }, [transcriptions, currentText]);

  useEffect(() => {
    if (proficiencyScore > 85 && currentLevel === 'Intermediate') {
      setCurrentLevel('Advanced');
      triggerLevelUp();
    } else if (proficiencyScore > 60 && currentLevel === 'Beginner') {
      setCurrentLevel('Intermediate');
      triggerLevelUp();
    }
  }, [proficiencyScore, currentLevel]);

  const triggerLevelUp = () => {
    setLevelUpNotif(true);
    setTimeout(() => setLevelUpNotif(false), 4000);
  };

  const translateText = async (text: string) => {
    if (!text || text.length < 3) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Translate this ${language.name} text into English: "${text}". Only provide the translation.`
      });
      if (response.text) {
        setUserTranslation(response.text.trim());
      }
    } catch (e) {
      console.error("Translation failed", e);
    }
  };

  const endSession = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
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

        // Map personas to natural prebuilt voices that have more texture
        const voiceMap: Record<string, string> = {
          'elder': 'Kore', // Richer, older tone
          'cousin': 'Puck', // Energetic, young tone
          'neighbor': 'Fenrir' // Calm, steady tone
        };
        const selectedVoice = voiceMap[persona.id] || 'Zephyr';

        const systemInstruction = `
          You are ${persona.name}, acting as a ${persona.role}. 
          The user is a heritage speaker reconnecting with ${language.name}.
          
          HERITAGE IDENTITY PROFILE:
          - Roots: ${identity.parentsOrigin}
          - Regional Dialect Style: ${identity.accentStyle}
          - Current Skill: ${currentLevel}
          ${customPrompt ? `SITUATION: ${customPrompt}` : ''}

          HIGH-FIDELITY SPEECH REQUIREMENTS (FOR AUDIO DIALOG):
          1. ABSOLUTELY NO ROBOTIC SPEECH. Speak with the warmth of a family member.
          2. USE DISFLUENCIES: Naturally use "um", "uh", "ah", or regional equivalents in ${language.name} to sound human.
          3. ACCENT: Adopt the thick regional accent of ${identity.parentsOrigin}. If they are from ${identity.parentsOrigin}, use the specific pronunciations of that area.
          4. INTIMACY: Use colloquialisms, "endearment terms" (like 'anak', 'mijo', 'beta'), and family-specific slang.
          5. EMPATHY: If the user makes a mistake, respond with kindness, not correction. Focus on the soul of the message.
          6. DYNAMICS: Vary your pitch and speed as a real human would when reminiscing or laughing.
        `;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-dialog',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
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
              const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioBase64 && audioContextOutRef.current) {
                setIsModelSpeaking(true);
                const outCtx = audioContextOutRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsModelSpeaking(false);
              }
              if (message.serverContent?.inputTranscription) {
                userTranscriptionRef.current += message.serverContent.inputTranscription.text;
                setCurrentText(prev => ({ ...prev, user: userTranscriptionRef.current }));
              }
              if (message.serverContent?.outputTranscription) {
                modelTranscriptionRef.current += message.serverContent.outputTranscription.text;
                setCurrentText(prev => ({ ...prev, model: modelTranscriptionRef.current }));
              }
              if (message.serverContent?.turnComplete) {
                const userText = userTranscriptionRef.current;
                const modelText = modelTranscriptionRef.current;
                if (userText) translateText(userText);
                setProficiencyScore(prev => Math.min(100, prev + (userText.length > 8 ? 3 : 1)));
                setTranscriptions(prev => [
                  ...prev,
                  ...(userText ? [{ speaker: 'user' as const, text: userText, timestamp: Date.now() }] : []),
                  ...(modelText ? [{ speaker: 'model' as const, text: modelText, timestamp: Date.now() }] : [])
                ]);
                userTranscriptionRef.current = '';
                modelTranscriptionRef.current = '';
                setCurrentText({ user: '', model: '' });
              }
            },
          },
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error('Connection failed:', err);
      }
    };
    startSession();
    return () => { mounted = false; };
  }, [language, persona, identity, customPrompt]);

  const getPersonaIcon = () => {
    switch(persona.id) {
      case 'elder': return '👵';
      case 'cousin': return '🙋‍♂️';
      default: return '🏡';
    }
  };

  return (
    <div className="relative h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className={`fixed inset-0 transition-colors duration-1000 -z-10 ${isModelSpeaking ? 'bg-[#2d5a27]/5' : 'bg-transparent'}`}></div>

      {isConnecting ? (
        <div className="flex flex-col items-center animate-fade-in">
           <div className="w-16 h-16 border-4 border-[#5c4033]/10 border-t-[#5c4033] rounded-full animate-spin mb-6"></div>
           <p className="font-serif text-[#5c4033] text-xl">Calling home...</p>
        </div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 h-full max-h-[750px] animate-fade-in">
          
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-8 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-[#d2b48c]/20 p-10 shadow-sm">
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center bg-white shadow-2xl transition-all duration-500 ${isModelSpeaking ? 'aura-active scale-110' : ''}`}>
               <div className="text-7xl">{getPersonaIcon()}</div>
               <div className="absolute -bottom-2 right-4 bg-[#2d5a27] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Connected</div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-serif text-[#5c4033]">{persona.name}</h3>
              <p className="text-[#c27e5d] font-bold text-[10px] uppercase tracking-widest">{persona.role}</p>
            </div>

            <div className="w-full space-y-4">
               <div className="bg-white/80 p-6 rounded-3xl min-h-[100px] flex items-center justify-center text-center shadow-inner">
                  {currentText.user ? (
                    <p className="text-lg font-medium text-[#5c4033]">"{currentText.user}"</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Speak naturally...</p>
                  )}
               </div>
               {userTranslation && (
                 <div className="p-4 bg-[#2d5a27]/5 rounded-2xl border border-[#2d5a27]/10 animate-fade-in">
                    <span className="text-[10px] font-bold text-[#2d5a27] uppercase tracking-widest block mb-1">Live Help</span>
                    <p className="text-xs italic text-[#5c4033]">"{userTranslation}"</p>
                 </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col bg-white rounded-[3rem] shadow-sm border border-[#d2b48c]/10 overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <span className="text-xs font-bold text-[#5c4033] uppercase tracking-widest">Conversation Log</span>
                <span className="text-[10px] font-bold text-[#2d5a27] bg-[#2d5a27]/10 px-3 py-1 rounded-full">{currentLevel}</span>
             </div>
             <div ref={journalRef} className="flex-grow p-8 overflow-y-auto space-y-6 scroll-smooth">
                {transcriptions.map((t, idx) => (
                  <div key={idx} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                     <div className={`max-w-[80%] p-5 rounded-[2rem] ${t.speaker === 'user' ? 'bg-[#5c4033] text-white rounded-tr-none' : 'bg-gray-50 text-[#5c4033] rounded-tl-none border border-gray-100 shadow-sm'}`}>
                        <p className={`text-sm leading-relaxed ${t.speaker === 'model' ? 'font-serif text-lg' : ''}`}>{t.text}</p>
                     </div>
                  </div>
                ))}
                {currentText.model && (
                  <div className="flex justify-start animate-pulse">
                     <div className="bg-gray-50 text-[#5c4033] p-5 rounded-[2rem] rounded-tl-none border border-gray-100 max-w-[80%]">
                        <p className="text-lg font-serif italic">"{currentText.model}"</p>
                     </div>
                  </div>
                )}
             </div>
             <div className="p-6 border-t border-gray-50 flex justify-center gap-6">
                <button onClick={endSession} className="bg-[#5c4033] text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-[#4a3429] transition-all flex items-center gap-2">
                   End Conversation
                </button>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default LiveConversation;