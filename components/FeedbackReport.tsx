
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Language, TranscriptionItem, EvaluationReport } from '../types';

interface FeedbackReportProps {
  language: Language;
  transcriptions: TranscriptionItem[];
  onRestart: () => void;
  onSave?: (score: number, feedbackPreview: string) => void;
}

const FeedbackReport: React.FC<FeedbackReportProps> = ({ language, transcriptions, onRestart, onSave }) => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef(false);

  useEffect(() => {
    const generateFeedback = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const conversationText = transcriptions.map(t => `${t.speaker}: ${t.text}`).join('\n');
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview', 
          contents: `Analyze this language learning conversation in ${language.name}. 
          The student is a heritage speaker reconnecting with their roots. Many feel shame about "broken" language.
          
          Conversation History:
          ${conversationText}
          
          Provide a compassionate, expert evaluation focusing on:
          1. Pronunciation accuracy and regional accent markers.
          2. Cultural nuance and identity connection.
          3. Confidence and emotional expression.
          4. Vocabulary and grammar usage.
          
          Encourage the student deeply. Focus on the beauty of their unique "heritage" voice.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER, description: 'Percentage 0-100' },
                fluency: { type: Type.NUMBER },
                pronunciation: { type: Type.NUMBER },
                vocabulary: { type: Type.NUMBER },
                culturalNuance: { type: Type.NUMBER },
                feedback: { type: Type.STRING, description: 'A supportive, insightful message about their progress and voice.' },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Constructive tips for pronunciation or phrasing.' },
              },
              required: ['overallScore', 'feedback', 'strengths', 'areasToImprove', 'pronunciation'],
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          setReport(parsed);
          
          if (onSave && !savedRef.current) {
            onSave(parsed.overallScore, parsed.feedback.substring(0, 100) + '...');
            savedRef.current = true;
          }
        }
      } catch (err) {
        console.error('Feedback generation failed:', err);
      } finally {
        setLoading(false);
      }
    };

    if (transcriptions.length > 0) {
      generateFeedback();
    } else {
      setLoading(false);
    }
  }, [language, transcriptions, onSave]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 border-4 border-[#2d5a27]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#2d5a27] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🌿</div>
        </div>
        <p className="text-2xl font-serif text-[#5c4033] mb-2">Reflecting on your journey...</p>
        <p className="text-sm text-[#c27e5d] font-medium tracking-widest uppercase">Honoring your heritage voice</p>
      </div>
    );
  }

  if (!report && transcriptions.length === 0) {
    return (
      <div className="text-center py-24 px-6 max-w-lg mx-auto bg-white rounded-[3rem] shadow-xl border border-[#d2b48c]/20 animate-slide-up">
        <div className="text-6xl mb-6">🌱</div>
        <h2 className="text-3xl font-serif text-[#5c4033] mb-4">A Quiet Exchange</h2>
        <p className="text-gray-500 mb-10 leading-relaxed">Every word is a bridge to your past. Try speaking a bit more in your next session to unlock deeper insights into your progress.</p>
        <button onClick={onRestart} className="bg-[#2d5a27] text-white px-12 py-4 rounded-full font-bold shadow-lg hover:bg-[#23471f] transition-all transform hover:-translate-y-1">Return to Garden</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <span className="text-xs font-bold text-[#c27e5d] uppercase tracking-[0.4em] mb-4 block">Growth Reflection</span>
        <h2 className="text-5xl font-serif text-[#5c4033] mb-4">Your Roots are Resonating</h2>
        <p className="text-lg text-gray-400 italic font-light">"To speak is to inherit a world."</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-sm border border-[#d2b48c]/20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-serif text-[#5c4033] font-bold">Linguistic Pulse</h3>
              <p className="text-sm text-gray-400">Markers for your {language.name} practice</p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-serif text-[#2d5a27] font-bold">{report?.overallScore}%</div>
              <div className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest">Heritage Affinity</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <StatCircle label="Pronunciation" value={report?.pronunciation || 0} color="#2d5a27" />
            <StatCircle label="Cultural Nuance" value={report?.culturalNuance || 0} color="#c27e5d" />
            <StatBar label="Conversational Fluency" value={report?.fluency || 0} />
            <StatBar label="Ancestral Vocabulary" value={report?.vocabulary || 0} />
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#5c4033] text-white p-10 rounded-[3rem] shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
          </div>
          <h3 className="text-2xl font-serif italic mb-6 relative z-10 border-b border-white/10 pb-4">Heart-led Insight</h3>
          <p className="text-white/90 leading-relaxed text-lg italic relative z-10 flex-grow">
            "{report?.feedback}"
          </p>
          <div className="mt-8 pt-6 relative z-10">
            <div className="bg-white/10 p-4 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Authenticity Check</p>
              <p className="text-sm font-medium">Your regional accent markers are showing beautiful progress.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-[#2d5a27]/5 p-8 rounded-[2.5rem] border border-[#2d5a27]/10 group hover:bg-[#2d5a27]/10 transition-colors">
          <h4 className="font-bold text-[#2d5a27] text-lg mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-[#2d5a27]/20 flex items-center justify-center mr-3 text-sm">✨</span>
            Regional Strengths
          </h4>
          <ul className="space-y-4">
            {report?.strengths.map((s, i) => (
              <li key={i} className="text-[#5c4033] flex items-start text-sm leading-relaxed">
                <span className="mr-3 text-[#2d5a27] mt-1 font-bold">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#c27e5d]/5 p-8 rounded-[2.5rem] border border-[#c27e5d]/10 group hover:bg-[#c27e5d]/10 transition-colors">
          <h4 className="font-bold text-[#c27e5d] text-lg mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-[#c27e5d]/20 flex items-center justify-center mr-3 text-sm">🌱</span>
            Path to Fluency
          </h4>
          <ul className="space-y-4">
            {report?.areasToImprove.map((a, i) => (
              <li key={i} className="text-[#5c4033] flex items-start text-sm leading-relaxed">
                <span className="mr-3 text-[#c27e5d] mt-1 font-bold">→</span> {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={onRestart}
          className="group relative bg-[#2d5a27] text-white px-20 py-5 rounded-full font-bold text-xl shadow-2xl hover:bg-[#23471f] transition-all transform hover:-translate-y-1 active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">Tending to Your Garden</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>
        <p className="text-xs text-gray-400 font-bold tracking-[0.3em] uppercase opacity-70">The journey back to self</p>
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="w-full">
    <div className="flex justify-between text-[10px] font-bold text-[#5c4033] uppercase tracking-wider mb-2">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-[#5c4033] rounded-full transition-all duration-1500 ease-out" 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

const StatCircle: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-6">
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#f3f4f6" strokeWidth="5" />
        <circle 
          cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="5" 
          strokeDasharray={226} 
          strokeDashoffset={226 - (226 * value) / 100} 
          strokeLinecap="round"
          className="transition-all duration-1500 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-bold font-serif" style={{ color }}>{value}%</span>
    </div>
    <div>
      <p className="text-[10px] font-bold text-[#5c4033] uppercase tracking-widest leading-tight">{label}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Regional Marker</p>
    </div>
  </div>
);

export default FeedbackReport;
