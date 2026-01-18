
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { LessonPlan, IdentityProfile, SessionRecord, Language } from '../types';
import { LANGUAGES } from '../constants';

interface LessonPlansProps {
  identity: IdentityProfile;
  sessions: SessionRecord[];
  language: Language | null;
  onBack: () => void;
  onSelectLanguage: (l: Language) => void;
  onStartLesson: (l: LessonPlan) => void;
}

const LessonPlans: React.FC<LessonPlansProps> = ({ identity, sessions, language, onBack, onSelectLanguage, onStartLesson }) => {
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiGuideInput, setAiGuideInput] = useState('');
  const [aiGuideResponse, setAiGuideResponse] = useState<string | null>(null);
  const [isAiGuiding, setIsAiGuiding] = useState(false);

  const generatePathways = async () => {
    if (!language) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const recentHistory = sessions.slice(-3).map(s => s.feedbackPreview).join('; ');
      
      const prompt = `
        Generate exactly 6 "Identity Lessons" for a heritage speaker learning ${language.name}.
        Group them into 3 difficulty tiers: "Roots" (Beginner), "Stems" (Intermediate), "Leaves" (Advanced).
        
        USER CONTEXT:
        - Ancestry: ${identity.parentsOrigin}
        - Preferred Style: ${identity.accentStyle}
        - Reconnection Goal: ${identity.culturalGoal}
        
        Format each lesson with a 'specificRoleplayPrompt' which is a 2-sentence instruction for an AI persona to roleplay this scenario with the user.
        Lessons should be culturally hyper-specific (e.g. if Ilocano, mention specific regional dishes or traditions).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                focusArea: { type: Type.STRING },
                culturalContext: { type: Type.STRING },
                suggestedVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
                difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                specificRoleplayPrompt: { type: Type.STRING }
              },
              required: ['id', 'title', 'description', 'difficulty', 'specificRoleplayPrompt']
            }
          }
        }
      });

      if (response.text) {
        setLessons(JSON.parse(response.text));
      }
    } catch (err) {
      console.error('Failed to generate pathways:', err);
    } finally {
      setLoading(false);
    }
  };

  const askAiGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGuideInput.trim() || !language) return;
    setIsAiGuiding(true);
    setAiGuideResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am a heritage speaker of ${language.name} from ${identity.parentsOrigin}. My goal is ${identity.culturalGoal}. Answer this question with cultural empathy and expert linguistic knowledge: "${aiGuideInput}"`
      });
      setAiGuideResponse(res.text || "I couldn't find an answer, but keep digging into your roots.");
    } catch (err) {
      setAiGuideResponse("Connection to ancestral wisdom interrupted. Try again soon.");
    } finally {
      setIsAiGuiding(false);
    }
  };

  useEffect(() => {
    if (lessons.length === 0 && language) {
      generatePathways();
    }
  }, [language]);

  if (!language) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-fade-in">
        <h2 className="text-3xl font-serif text-[#5c4033] mb-6">Choose a Path to Explore</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => onSelectLanguage(l)} className="p-6 bg-white rounded-3xl border border-[#d2b48c]/30 hover:border-[#2d5a27] transition-all group">
               <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{l.flag}</span>
               <span className="font-bold text-[#5c4033]">{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const tieredLessons = {
    Beginner: lessons.filter(l => l.difficulty === 'Beginner'),
    Intermediate: lessons.filter(l => l.difficulty === 'Intermediate'),
    Advanced: lessons.filter(l => l.difficulty === 'Advanced'),
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in pb-32">
      <div className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="text-[#c27e5d] font-bold flex items-center gap-2 hover:-translate-x-1 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full border border-[#d2b48c]/30 shadow-sm">
           <span className="text-2xl">{language.flag}</span>
           <span className="font-serif font-bold text-[#5c4033]">{language.nativeName} Pathways</span>
        </div>
      </div>

      <div className="mb-16 text-center">
        <h1 className="text-5xl font-serif text-[#5c4033] mb-4">Your Language Tree</h1>
        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed italic">
          "A person who knows two languages is worth two people." – Every word you reclaim is a piece of yourself returned.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-[#2d5a27]/10 border-t-[#2d5a27] rounded-full animate-spin mb-6"></div>
          <p className="text-2xl font-serif text-[#5c4033] animate-pulse">Consulting the elders...</p>
        </div>
      ) : (
        <div className="space-y-24 relative">
          {/* Vertical growth line decoration */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#d2b48c]/10 via-[#2d5a27]/20 to-transparent -translate-x-1/2 hidden lg:block"></div>

          {Object.entries(tieredLessons).map(([difficulty, items], idx) => (
            <div key={difficulty} className="relative z-10">
              <div className="flex items-center justify-center mb-12">
                 <div className="bg-[#5c4033] text-white px-8 py-2 rounded-full font-serif text-xl shadow-lg">
                    Level {idx + 1}: {difficulty === 'Beginner' ? 'Roots' : difficulty === 'Intermediate' ? 'Stems' : 'Leaves'}
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {items.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-[2.5rem] p-8 border border-[#d2b48c]/20 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-[#2d5a27]/10 p-3 rounded-2xl">
                        <svg className="w-6 h-6 text-[#2d5a27]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{difficulty} Quest</span>
                    </div>
                    
                    <h3 className="text-2xl font-serif text-[#5c4033] mb-3 group-hover:text-[#2d5a27] transition-colors">{lesson.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-grow">{lesson.description}</p>
                    
                    <div className="bg-[#fcfaf7] p-5 rounded-3xl mb-8 border border-[#d2b48c]/10">
                       <p className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest mb-2">Heritage Hint</p>
                       <p className="text-xs text-[#5c4033] italic leading-snug">{lesson.culturalContext}</p>
                    </div>

                    <button 
                      onClick={() => onStartLesson(lesson)}
                      className="w-full py-4 bg-[#5c4033] text-white rounded-2xl font-bold flex items-center justify-center gap-3 group/btn hover:bg-[#2d5a27] transition-all shadow-md active:scale-95"
                    >
                      <span className="text-lg">Practice Dialogue</span>
                      <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Cultural Guide Section */}
      <div className="mt-24 max-w-4xl mx-auto">
        <div className="bg-[#5c4033] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-serif mb-4 italic">The Cultural Sensei</h2>
            <p className="text-white/70 mb-8 max-w-xl">Ask any question about {language.name} culture, family traditions, or linguistic nuances. I am here to bridge the gap between your world and your roots.</p>
            
            <form onSubmit={askAiGuide} className="flex flex-col sm:flex-row gap-4">
              <input 
                value={aiGuideInput}
                onChange={e => setAiGuideInput(e.target.value)}
                placeholder="Why do we say 'Beta' to everyone? / How to respect elders?"
                className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:bg-white/20 transition-all placeholder:text-white/30 text-white"
              />
              <button 
                type="submit"
                disabled={isAiGuiding}
                className="bg-[#2d5a27] hover:bg-[#386b32] text-white px-10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isAiGuiding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Ask Wisely'}
              </button>
            </form>

            {aiGuideResponse && (
              <div className="mt-10 p-8 bg-white/5 rounded-3xl border border-white/10 animate-slide-up">
                 <p className="text-sm font-serif leading-relaxed italic text-white/90">"{aiGuideResponse}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlans;
