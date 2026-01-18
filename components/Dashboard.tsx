
import React, { useMemo } from 'react';
import { User, SessionRecord, Language, IdentityProfile } from '../types';
import { LANGUAGES } from '../constants';

interface DashboardProps {
  user: User | null;
  sessions: SessionRecord[];
  identity: IdentityProfile;
  onStartNew: () => void;
  onViewSession: (id: string) => void;
  onOpenAlbum: () => void;
  onOpenPathways: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, sessions, identity, onStartNew, onViewSession, onOpenAlbum, onOpenPathways }) => {
  const stats = useMemo(() => {
    if (!sessions) return { totalSessions: 0, avgScore: 0, languagesPracticed: 0, topLang: null };
    
    const totalSessions = sessions.length;
    const avgScore = totalSessions > 0 
      ? Math.round(sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalSessions) 
      : 0;
    const languagesPracticed = new Set(sessions.map(s => s.languageCode)).size;
    
    const langCounts: Record<string, number> = {};
    sessions.forEach(s => {
      langCounts[s.languageCode] = (langCounts[s.languageCode] || 0) + 1;
    });
    const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
    const topLangCode = sortedLangs.length > 0 ? sortedLangs[0][0] : null;
    const topLang = topLangCode ? LANGUAGES.find(l => l.code === topLangCode) : null;

    return { totalSessions, avgScore, languagesPracticed, topLang };
  }, [sessions]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif text-[#5c4033] mb-2">Welcome back, {user.name}</h1>
          <p className="text-[#c27e5d] font-medium italic">
            {identity?.heritageTitle ? `${identity.heritageTitle} roots deepening...` : "Your roots are deepening every day."}
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={onOpenPathways}
            className="bg-white text-[#2d5a27] px-6 py-4 rounded-full font-bold shadow-md border border-[#2d5a27]/20 hover:bg-[#2d5a27]/5 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.487V6a2 2 0 011.106-1.789L9 1.5l5.894 2.711A2 2 0 0116 6v9.487a2 2 0 01-1.106 1.789L9 20z" /></svg>
            Cultural Pathways
          </button>
          <button
            onClick={onOpenAlbum}
            className="bg-white text-[#5c4033] px-6 py-4 rounded-full font-bold shadow-md border border-[#d2b48c]/30 hover:bg-[#fcfaf7] transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Heritage Album
          </button>
          <button
            onClick={onStartNew}
            className="bg-[#2d5a27] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#23471f] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Practice Now
          </button>
        </div>
      </div>

      {/* Garden Visualization */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#d2b48c]/20 mb-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
          <svg className="w-48 h-48 text-[#2d5a27]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-[#5c4033] mb-8">Your Language Garden</h2>
        
        <div className="flex flex-wrap gap-8 items-end justify-center py-4">
          {LANGUAGES.filter(l => sessions?.some(s => s.languageCode === l.code)).map(lang => {
            const langSessions = sessions.filter(s => s.languageCode === lang.code);
            const proficiency = Math.round(langSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / langSessions.length);
            const growthLevel = Math.min(langSessions.length, 10) * 10; 
            
            return (
              <div key={lang.code} className="flex flex-col items-center group cursor-help">
                <div className="relative mb-4">
                  <div 
                    className="w-16 bg-[#2d5a27] rounded-t-full transition-all duration-1000 origin-bottom"
                    style={{ height: `${20 + growthLevel}px`, opacity: proficiency / 100 }}
                  ></div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl group-hover:scale-125 transition-transform">
                    {lang.flag}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#5c4033] uppercase tracking-tighter">{lang.nativeName}</span>
                <span className="text-[10px] text-gray-400">{proficiency}% Strength</span>
              </div>
            );
          })}
          {(!sessions || sessions.length === 0) && (
            <div className="text-center py-10">
              <p className="text-gray-400 italic">No seeds planted yet. Start a session to see your garden grow.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reflection History */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#d2b48c]/20">
        <h2 className="text-xl font-bold text-[#5c4033] mb-6">Reflection History</h2>
        <div className="space-y-4">
          {sessions && sessions.length > 0 ? (
            sessions.slice().reverse().map(session => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-4 hover:bg-[#fcfaf7] rounded-xl transition-colors border border-transparent hover:border-[#d2b48c]/30 group cursor-pointer"
                onClick={() => onViewSession(session.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2d5a27]/10 rounded-full flex items-center justify-center text-xl">
                    {LANGUAGES.find(l => l.code === session.languageCode)?.flag}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#5c4033]">{session.languageName}</h4>
                    <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div className="hidden md:block max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    <p className="text-xs italic text-gray-400">"{session.feedbackPreview}"</p>
                  </div>
                  <div className="text-[#2d5a27] font-bold">{session.overallScore}%</div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-[#c27e5d] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-400">Your journal is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
