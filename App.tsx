import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Language, Persona, TranscriptionItem, User, SessionRecord, RootWord, IdentityProfile, LessonPlan } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import LanguageSelector from './components/LanguageSelector';
import LiveConversation from './components/LiveConversation';
import FeedbackReport from './components/FeedbackReport';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import HeritageAlbum from './components/HeritageAlbum';
import LessonPlans from './components/LessonPlans';
import Survey from './components/Survey';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<SessionRecord[]>([]);
  const [rootWords, setRootWords] = useState<RootWord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [identity, setIdentity] = useState<IdentityProfile>({ 
    heritageTitle: '', primaryDialect: '', culturalGoal: '',
    userOrigin: '', parentsOrigin: '', motivation: '', accentStyle: ''
  });
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const [sessionTranscriptions, setSessionTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  const loadUserData = useCallback(async (uid: string) => {
    if (!isSupabaseConfigured || !uid) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (profile) {
        setIdentity({
          heritageTitle: profile.heritage_title || '',
          primaryDialect: profile.primary_dialect || '',
          culturalGoal: profile.cultural_goal || '',
          userOrigin: profile.user_origin || '',
          parentsOrigin: profile.parents_origin || '',
          motivation: profile.motivation || '',
          accentStyle: profile.accent_style || ''
        });
      }
      const { data: sessions } = await supabase.from('sessions').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (sessions) {
        setUserSessions(sessions.map(s => ({
          id: s.id, date: new Date(s.created_at).getTime(),
          languageCode: s.language_code, languageName: s.language_name,
          overallScore: s.overall_score, feedbackPreview: s.feedback_preview
        })));
      }
      const { data: words } = await supabase.from('root_words').select('*').eq('user_id', uid);
      if (words) {
        setRootWords(words.map(w => ({
          id: w.id, word: w.word, meaning: w.meaning,
          culturalSignificance: w.cultural_significance, languageCode: w.language_code
        })));
      }
      const { data: plans } = await supabase.from('lesson_plans').select('*').eq('user_id', uid);
      if (plans) {
        setLessonPlans(plans.map(p => ({
          id: p.id, title: p.title, description: p.description,
          focusArea: p.focus_area, culturalContext: p.cultural_context,
          suggestedVocabulary: p.suggested_vocabulary || [],
          isCompleted: p.is_completed,
          difficulty: p.difficulty,
          specificRoleplayPrompt: p.specific_roleplay_prompt
        })));
      }
    } catch (err) { console.warn("Failed to load user data:", err); }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const fallbackTimer = setTimeout(() => setIsLoading(false), 5000);

    const checkInitialAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          setIsLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          setCurrentUser({ 
            name: session.user.user_metadata.name || 'Explorer', 
            email: session.user.email || '' 
          });
          await loadUserData(session.user.id);
          setCurrentState(AppState.DASHBOARD);
        }
      } catch (err) {
        console.error("Initial auth check failed", err);
      } finally {
        setIsLoading(false);
        clearTimeout(fallbackTimer);
      }
    };

    checkInitialAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setCurrentUser({ 
          name: session.user.user_metadata.name || 'Explorer', 
          email: session.user.email || '' 
        });
        if (event === 'SIGNED_IN') await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null); 
        setCurrentUser(null); 
        setCurrentState(AppState.LOGIN);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [loadUserData]);

  const handleStartLesson = (lesson: LessonPlan) => {
    setCustomPrompt(lesson.specificRoleplayPrompt || null);
    setCurrentState(AppState.ONBOARDING);
  };

  const handleSaveLessons = async (newLessons: LessonPlan[]) => {
    setLessonPlans(newLessons);
    if (userId && isSupabaseConfigured) {
      const payloads = newLessons.map(l => ({
        user_id: userId, title: l.title, description: l.description,
        focus_area: l.focusArea, cultural_context: l.culturalContext,
        suggested_vocabulary: l.suggestedVocabulary, difficulty: l.difficulty,
        specific_roleplay_prompt: l.specificRoleplayPrompt, is_completed: false
      }));
      await supabase.from('lesson_plans').insert(payloads);
    }
  };

  const handleSurveyComplete = async (newIdentity: IdentityProfile) => {
    setIdentity(newIdentity);
    setCurrentState(AppState.DASHBOARD);
    setSyncStatus('syncing');
    const { data: { user } } = await supabase.auth.getUser();
    if (user && isSupabaseConfigured) {
      const { error: syncError } = await supabase.from('profiles').upsert({
        id: user.id, heritage_title: newIdentity.heritageTitle,
        primary_dialect: newIdentity.primaryDialect, cultural_goal: newIdentity.culturalGoal,
        user_origin: newIdentity.userOrigin, parents_origin: newIdentity.parentsOrigin,
        motivation: newIdentity.motivation, accent_style: newIdentity.accentStyle,
        updated_at: new Date().toISOString()
      });
      setSyncStatus(syncError ? 'error' : 'success');
    }
  };

  const handleAddRootWord = async (word: RootWord) => {
    const tempId = `local-${Date.now()}`;
    setRootWords(prev => [...prev, { ...word, id: tempId }]);
    if (userId && isSupabaseConfigured) {
      await supabase.from('root_words').insert({
        user_id: userId, word: word.word, meaning: word.meaning,
        cultural_significance: word.culturalSignificance, language_code: word.languageCode
      });
    }
  };

  const handleEvaluationComplete = async (score: number, feedbackPreview: string) => {
    if (!selectedLanguage || !userId || !isSupabaseConfigured) return;
    const newSession = {
      id: '', date: Date.now(),
      languageCode: selectedLanguage.code, languageName: selectedLanguage.name,
      overallScore: score, feedbackPreview
    };
    setUserSessions(prev => [newSession, ...prev]);
    await supabase.from('sessions').insert({
      user_id: userId, language_code: selectedLanguage.code,
      language_name: selectedLanguage.name, overall_score: score,
      feedback_preview: feedbackPreview
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
        <div className="w-10 h-10 border-4 border-[#5c4033]/10 border-t-[#5c4033] rounded-full animate-spin mb-4"></div>
        <div className="text-center animate-pulse">
           <p className="text-[#5c4033] font-serif text-xl mb-1">Raíz is blooming...</p>
           <p className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-[0.3em]">Preparing your sanctuary</p>
        </div>
      </div>
    );
  }

  const isNavigationVisible = currentUser && ![AppState.LOGIN, AppState.SIGNUP, AppState.SURVEY, AppState.CONVERSATION].includes(currentState);

  return (
    <div className="min-h-screen text-gray-800 bg-[#fcfaf7] flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full sticky top-0 z-50 bg-[#fcfaf7]/80 backdrop-blur-md">
        <button onClick={() => setCurrentState(AppState.DASHBOARD)} className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-[#5c4033] rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:shadow-lg">
            <span className="text-white font-serif font-bold text-xl">R</span>
          </div>
          <span className="text-[#5c4033] font-serif text-2xl font-bold tracking-tight">Raíz</span>
        </button>
        {currentUser && (
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
               <span className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest">{identity.accentStyle || 'New Seeker'}</span>
               <span className="text-sm font-bold text-[#5c4033]">{currentUser.name}</span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {currentState === AppState.LOGIN && <Login onSwitchToSignup={() => setCurrentState(AppState.SIGNUP)} />}
        {currentState === AppState.SIGNUP && <Signup onSignup={() => setCurrentState(AppState.SURVEY)} onSwitchToLogin={() => setCurrentState(AppState.LOGIN)} />}
        {currentState === AppState.SURVEY && <Survey onComplete={handleSurveyComplete} />}
        {currentState === AppState.DASHBOARD && (
          <Dashboard user={currentUser} sessions={userSessions} identity={identity} onStartNew={() => { setCustomPrompt(null); setCurrentState(AppState.ONBOARDING); }} onViewSession={(id) => console.log('View', id)} onOpenAlbum={() => setCurrentState(AppState.HERITAGE_ALBUM)} onOpenPathways={() => setCurrentState(AppState.LESSON_PLANS)} />
        )}
        {currentState === AppState.HERITAGE_ALBUM && (
          <HeritageAlbum rootWords={rootWords} profile={identity} onUpdateProfile={setIdentity} onAddWord={handleAddRootWord} onBack={() => setCurrentState(AppState.DASHBOARD)} />
        )}
        {currentState === AppState.LESSON_PLANS && (
          <LessonPlans identity={identity} sessions={userSessions} existingLessons={lessonPlans} language={selectedLanguage} onBack={() => setCurrentState(AppState.DASHBOARD)} onSelectLanguage={setSelectedLanguage} onStartLesson={handleStartLesson} onSaveLessons={handleSaveLessons} />
        )}
        {currentState === AppState.ONBOARDING && (
          <LanguageSelector selectedLanguage={selectedLanguage} onSelectLanguage={setSelectedLanguage} selectedPersona={selectedPersona} onSelectPersona={setSelectedPersona} onStart={() => setCurrentState(AppState.CONVERSATION)} />
        )}
        {currentState === AppState.CONVERSATION && selectedLanguage && selectedPersona && (
          <LiveConversation language={selectedLanguage} persona={selectedPersona} identity={identity} customPrompt={customPrompt} onEnd={(t) => { setSessionTranscriptions(t); setCurrentState(AppState.EVALUATION); }} />
        )}
        {currentState === AppState.EVALUATION && selectedLanguage && (
          <FeedbackReport language={selectedLanguage} transcriptions={sessionTranscriptions} onRestart={() => setCurrentState(AppState.DASHBOARD)} onSave={handleEvaluationComplete} />
        )}
      </main>

      {isNavigationVisible && (
        <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 flex justify-around items-center z-50 md:hidden">
           <button onClick={() => setCurrentState(AppState.DASHBOARD)} className={`p-2 ${currentState === AppState.DASHBOARD ? 'text-[#2d5a27]' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
           </button>
           <button onClick={() => setCurrentState(AppState.HERITAGE_ALBUM)} className={`p-2 ${currentState === AppState.HERITAGE_ALBUM ? 'text-[#2d5a27]' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>
           </button>
           <button onClick={() => { setCustomPrompt(null); setCurrentState(AppState.ONBOARDING); }} className="w-12 h-12 bg-[#2d5a27] text-white rounded-full flex items-center justify-center shadow-lg -mt-8">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           </button>
           <button onClick={() => setCurrentState(AppState.LESSON_PLANS)} className={`p-2 ${currentState === AppState.LESSON_PLANS ? 'text-[#2d5a27]' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
           </button>
           <button onClick={() => supabase.auth.signOut()} className="p-2 text-gray-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>
           </button>
        </nav>
      )}
    </div>
  );
};

export default App;