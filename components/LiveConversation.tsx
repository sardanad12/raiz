
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

        const systemInstruction = `
          You are ${persona.name}, acting as a ${persona.role}. 
          The user is a heritage speaker reconnecting with ${language.name}.
          
          HERITAGE IDENTITY:
          - User is from: ${identity.userOrigin}
          - Ancestral roots in: ${identity.parentsOrigin}
          - Specific Accent/Style: ${identity.accentStyle}
          - Personal Motivation: ${identity.motivation}
          - Current Proficiency: ${currentLevel}
          
          ${customPrompt ? `SPECIFIC LESSON SCENARIO: ${customPrompt}` : ''}

          ADAPTIVE STYLE:
          - Always use the ${identity.accentStyle} linguistic style and regional slang where possible.
          - Speak with deep warmth and family-like intimacy.
          - If Proficiency is Beginner: Use simple words and short sentences.
          - If Proficiency is Intermediate/Advanced: Speak naturally with native regional nuances.
          
          Accept English code-switching as a natural part of the diaspora experience. Help them translate their feelings back into ${language.name}.
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
              const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
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
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
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
                const userText = userTranscriptionRef.current;
                const modelText = modelTranscriptionRef.current;
                if (userText) translateText(userText);
                setProficiencyScore(prev => Math.min(100, prev + (userText.length > 10 ? 4 : 1)));
                setTranscriptions(prev => {
                  const newItems: TranscriptionItem[] = [];
                  if (userText) newItems.push({ speaker: 'user', text: userText, timestamp: Date.now() });
                  if (modelText) newItems.push({ speaker: 'model', text: modelText, timestamp: Date.now() });
                  return [...prev, ...newItems];
                });
                userTranscriptionRef.current = '';
                modelTranscriptionRef.current = '';
                setCurrentText({ user: '', model: '' });
              }
            },
          },
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error('Session error:', err);
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
    <div className="relative min-h-[85vh] flex flex-col items-center pt-8 pb-12 px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2d5a27]/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c27e5d]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {isConnecting ? (
        <div className="flex-grow flex flex-col items-center justify-center relative z-10">
          <div className="relative w-24 h-24 mb-6">
             <div className="absolute inset-0 border-4 border-[#2d5a27]/20 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-[#2d5a27] border-t-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center text-4xl">{language.flag}</div>
          </div>
          <p className="text-2xl font-serif text-[#5c4033] animate-pulse">Connecting to your roots...</p>
          <p className="text-sm text-[#c27e5d] mt-2 font-medium tracking-widest uppercase">Preparing {identity.accentStyle || language.name} Session</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl flex flex-col h-[75vh] relative z-10">
          {levelUpNotif && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#2d5a27] text-white px-10 py-4 rounded-full font-bold shadow-2xl animate-bounce flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest opacity-80">New Proficiency Reached</p>
                <p className="text-lg">You are now {currentLevel}!</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-6 mb-8 px-2">
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-[#d2b48c]/20">
              <div className="w-12 h-12 bg-[#2d5a27] rounded-full flex items-center justify-center text-2xl shadow-inner">
                {getPersonaIcon()}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-[#5c4033]">{persona.name}</h4>
                <p className="text-[10px] font-medium text-[#c27e5d] uppercase tracking-tighter">{persona.role}</p>
              </div>
            </div>

            <div className="flex-1 max-w-sm hidden md:block text-center">
              {customPrompt && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-[#2d5a27] uppercase tracking-widest bg-white/80 px-4 py-1 rounded-full border border-[#2d5a27]/20">Active Lesson Mode</span>
                </div>
              )}
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-bold text-[#5c4033] uppercase tracking-widest">Growth Meter</span>
                <span className="text-xs font-bold text-[#2d5a27]">{proficiencyScore}%</span>
              </div>
              <div className="h-2 w-full bg-[#d2b48c]/20 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#d2b48c] to-[#2d5a27] transition-all duration-1000 ease-out shadow-sm" style={{ width: `${proficiencyScore}%` }}></div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-[#d2b48c]/20 text-right">
              <span className="text-[10px] font-bold text-[#5c4033] uppercase tracking-widest block mb-1">Identity Tone</span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-lg font-serif font-bold text-[#2d5a27]">{identity.accentStyle || language.nativeName}</span>
                <span className="text-xl">{language.flag}</span>
              </div>
            </div>
          </div>

          <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-white/40 backdrop-blur-lg rounded-[2.5rem] border border-[#d2b48c]/20 p-8 shadow-sm">
              <div className="relative mb-10 w-full flex flex-col items-center">
                <div className="absolute w-64 h-64 bg-[#2d5a27]/5 rounded-full pulse-ring" style={{ animationDuration: '3s' }}></div>
                <div className="absolute w-48 h-48 bg-[#c27e5d]/5 rounded-full pulse-ring" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
                <div className="relative z-10 w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-[#2d5a27]/30 group transition-transform hover:scale-105">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2d5a27]/5 to-transparent animate-pulse"></div>
                  {isListening ? (
                    <div className="flex gap-1 items-end h-8">
                       {[1,2,3,4,5].map(i => (
                         <div key={i} className="w-1.5 bg-[#2d5a27] rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>
                       ))}
                    </div>
                  ) : (
                    <svg className="w-12 h-12 text-[#2d5a27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </div>
                <div className="mt-8 text-center">
                   <p className="text-xl font-serif text-[#5c4033] font-bold">{currentLevel} <span className="text-[#c27e5d] italic font-normal">Fluency</span></p>
                   <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Session Active</p>
                </div>
              </div>
              <div className="w-full space-y-4">
                <div className="min-h-[60px] p-4 bg-white/80 rounded-2xl border border-[#d2b48c]/10 text-center flex items-center justify-center italic text-gray-400">
                  {currentText.user ? <p className="text-[#5c4033] font-medium leading-relaxed animate-fade-in">"{currentText.user}"</p> : <p className="text-sm">Speak when you're ready...</p>}
                </div>
                {userTranslation && (
                  <div className="p-4 bg-[#2d5a27]/5 rounded-2xl border border-[#2d5a27]/10 animate-slide-up">
                    <span className="text-[10px] font-bold text-[#2d5a27] uppercase tracking-widest block mb-1">Live Help</span>
                    <p className="text-sm text-[#5c4033] italic">"{userTranslation}"</p>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col bg-white/40 backdrop-blur-lg rounded-[2.5rem] border border-[#d2b48c]/20 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#d2b48c]/10 bg-white/20">
                <h3 className="text-lg font-serif text-[#5c4033] font-bold flex items-center gap-2">
                   <svg className="w-5 h-5 text-[#c27e5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                   Conversation Journal
                </h3>
              </div>
              <div ref={journalRef} className="flex-grow overflow-y-auto p-6 space-y-6 scroll-smooth">
                {transcriptions.map((t, i) => (
                  <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl ${t.speaker === 'user' ? 'bg-[#5c4033] text-white rounded-tr-none' : 'bg-white text-[#5c4033] shadow-sm rounded-tl-none border border-[#d2b48c]/10'}`}>
                      <p className={`text-sm leading-relaxed ${t.speaker === 'model' ? 'font-serif text-lg' : 'font-medium'}`}>{t.text}</p>
                      <p className={`text-[9px] mt-2 opacity-60 uppercase tracking-tighter ${t.speaker === 'user' ? 'text-right' : 'text-left'}`}>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                {currentText.model && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[85%] p-4 bg-white text-[#5c4033] shadow-sm rounded-3xl rounded-tl-none border border-[#d2b48c]/10">
                      <p className="text-lg font-serif leading-relaxed italic animate-pulse">"{currentText.model}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-10 flex justify-center items-center gap-12">
            <button onClick={endSession} className="group relative px-12 py-5 bg-[#5c4033] text-white rounded-full font-bold shadow-2xl hover:shadow-[#5c4033]/40 transition-all active:scale-95 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-[#c27e5d] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">Conclude & Reflect</span>
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" /></svg>
            </button>
            <p className="hidden md:block text-xs font-bold text-[#c27e5d] uppercase tracking-[0.3em] opacity-80">Roots of the {language.name} Diaspora</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveConversation;
