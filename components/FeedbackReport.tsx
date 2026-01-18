
import React, { useEffect, useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Language, TranscriptionItem, EvaluationReport } from '../types';

interface FeedbackReportProps {
  language: Language;
  transcriptions: TranscriptionItem[];
  onRestart: () => void;
}

const FeedbackReport: React.FC<FeedbackReportProps> = ({ language, transcriptions, onRestart }) => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateFeedback = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const conversationText = transcriptions.map(t => `${t.speaker}: ${t.text}`).join('\n');
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze this language learning conversation in ${language.name}. 
          The student is a heritage speaker reconnecting with their roots.
          
          Conversation:
          ${conversationText}
          
          Provide a compassionate evaluation. Focus on growth, confidence, and the emotional connection to the language rather than just academic accuracy.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER },
                fluency: { type: Type.NUMBER },
                pronunciation: { type: Type.NUMBER },
                vocabulary: { type: Type.NUMBER },
                culturalNuance: { type: Type.NUMBER },
                feedback: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['overallScore', 'feedback', 'strengths', 'areasToImprove'],
            }
          }
        });

        if (response.text) {
          setReport(JSON.parse(response.text));
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
  }, [language, transcriptions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#c27e5d] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-serif text-[#5c4033]">Gathering thoughts on your journey...</p>
      </div>
    );
  }

  if (!report && transcriptions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-serif text-[#5c4033] mb-4">A short silence</h2>
        <p className="text-gray-600 mb-8">It looks like we didn't catch enough of a conversation this time.</p>
        <button onClick={onRestart} className="bg-[#2d5a27] text-white px-8 py-3 rounded-full font-bold">Try Again</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif text-[#5c4033] mb-2">Your Roots are Growing</h2>
        <p className="text-lg text-[#c27e5d]">A reflection on your practice in {language.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#d2b48c]/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#5c4033]">Overall Connection</h3>
            <span className="text-4xl font-serif text-[#2d5a27]">{report?.overallScore}%</span>
          </div>
          
          <div className="space-y-6">
            <StatBar label="Fluency" value={report?.fluency || 0} />
            <StatBar label="Pronunciation" value={report?.pronunciation || 0} />
            <StatBar label="Vocabulary" value={report?.vocabulary || 0} />
            <StatBar label="Cultural Nuance" value={report?.culturalNuance || 0} />
          </div>
        </div>

        <div className="bg-[#5c4033] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center">
          <h3 className="text-xl font-serif italic mb-4">Note from the Heart</h3>
          <p className="text-white/90 leading-relaxed text-lg italic">
            "{report?.feedback}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#2d5a27]/5 p-6 rounded-2xl border border-[#2d5a27]/20">
          <h4 className="font-bold text-[#2d5a27] mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            What you did beautifully
          </h4>
          <ul className="space-y-2">
            {report?.strengths.map((s, i) => (
              <li key={i} className="text-sm text-[#5c4033] flex items-start">
                <span className="mr-2 text-[#2d5a27]">•</span> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#c27e5d]/5 p-6 rounded-2xl border border-[#c27e5d]/20">
          <h4 className="font-bold text-[#c27e5d] mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Gentle reminders
          </h4>
          <ul className="space-y-2">
            {report?.areasToImprove.map((a, i) => (
              <li key={i} className="text-sm text-[#5c4033] flex items-start">
                <span className="mr-2 text-[#c27e5d]">•</span> {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onRestart}
          className="bg-[#2d5a27] text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-[#23471f] transition-all"
        >
          Return to Roots
        </button>
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-xs font-bold text-[#5c4033] uppercase tracking-wider mb-1">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full h-2 bg-[#d2b48c]/20 rounded-full overflow-hidden">
      <div 
        className="h-full bg-[#2d5a27] rounded-full transition-all duration-1000" 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

export default FeedbackReport;
