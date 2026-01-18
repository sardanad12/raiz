
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
    heritageTitle: '', 
    primaryDialect: '', 
    culturalGoal: '',
    userOrigin: '',
    parentsOrigin: '',
    motivation: '',
    accentStyle: ''
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
      // Load Profile
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

      // Load Sessions
      const { data: sessions } = await supabase.from('sessions').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      if (sessions) {
        setUserSessions(sessions.map(s => ({
          id: s.id,
          date: new Date(s.created_at).getTime(),
          languageCode: s.language_code,
          languageName: s.language_name,
          overallScore: s.overall_score,
          feedbackPreview: s.feedback_preview
        })));
      }

      // Load Root Words
      const { data: words } = await supabase.from('root_words').select('*').eq('user_id', uid);
      if (words) {
        setRootWords(words.map(w => ({
          id: w.id,
          word: w.word,
          meaning: w.meaning,
          culturalSignificance: w.cultural_significance,
          languageCode: w.language_code
        })));
      }

      // Load Lesson Plans
      const { data: plans } = await supabase.from('lesson_plans').select('*').eq('user_id', uid);
      if (plans) {
        setLessonPlans(plans.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          focusArea: p.focus_area,
          culturalContext: p.cultural_context,
          suggestedVocabulary: p.suggested_vocabulary,
          isCompleted: p.is_completed,
          difficulty: p.difficulty,
          specificRoleplayPrompt: p.specific_roleplay_prompt
        })));
      }
    } catch (err) { console.warn("[Supabase] Data fetch warning:", err); }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const checkInitialAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setCurrentUser({ name: session.user.user_metadata.name || 'Explorer', email: session.user.email || '' });
        await loadUserData(session.user.id);
        setCurrentState(AppState.DASHBOARD);
      }
      setIsLoading(false);
    };
    checkInitialAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setCurrentUser({ name: session.user.user_metadata.name || 'Explorer', email: session.user.email || '' });
        if (event === 'SIGNED_IN') loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setCurrentUser(null);
        setCurrentState(AppState.LOGIN);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const handleStartLesson = (lesson: LessonPlan) => {
    setCustomPrompt(lesson.specificRoleplayPrompt || null);
    setCurrentState(AppState.ONBOARDING);
  };

  const handleSaveLessons = async (newLessons: LessonPlan[]) => {
    setLessonPlans(newLessons);
    if (userId && isSupabaseConfigured) {
      const payloads = newLessons.map(l => ({
        user_id: userId,
        title: l.title,
        description: l.description,
        focus_area: l.focusArea,
        cultural_context: l.culturalContext,
        suggested_vocabulary: l.suggestedVocabulary,
        difficulty: l.difficulty,
        specific_roleplay_prompt: l.specificRoleplayPrompt,
        is_completed: false
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
      const payload = {
        id: user.id,
        heritage_title: newIdentity.heritageTitle,
        primary_dialect: newIdentity.primaryDialect,
        cultural_goal: newIdentity.culturalGoal,
        user_origin: newIdentity.userOrigin,
        parents_origin: newIdentity.parentsOrigin,
        motivation: newIdentity.motivation,
        accent_style: newIdentity.accentStyle,
        updated_at: new Date().toISOString()
      };
      const { error: syncError } = await supabase.from('profiles').upsert(payload);
      setSyncStatus(syncError ? 'error' : 'success');
    }
  };

  const handleAddRootWord = async (word: RootWord) => {
    setRootWords(prev => [...prev, { ...word, id: `local-${Date.now()}` }]);
    if (userId) {
      await supabase.from('root_words').insert({
        user_id: userId,
        word: word.word,
        meaning: word.meaning,
        cultural_significance: word.culturalSignificance,
        language_code: word.languageCode
      });
    }
  };

  const saveNewSession = async (record: SessionRecord) => {
    setUserSessions(prev => [ { ...record, id: `session-${Date.now()}` }, ...prev]);
    if (userId) {
      await supabase.from('sessions').insert({
        user_id: userId,
        language_code: record.languageCode,
        language_name: record.languageName,
        overall_score: record.overallScore,
        feedback_preview: record.feedbackPreview
      });
    }
  };

  const handleEvaluationComplete = async (score: number, feedbackPreview: string) => {
    if (!selectedLanguage) return;
    await saveNewSession({
      id: '', date: Date.now(),
      languageCode: selectedLanguage.code,
      languageName: selectedLanguage.name,
      overallScore: score,
      feedbackPreview
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
        <div className="w-12 h-12 border-4 border-[#5c4033]/20 border-t-[#5c4033] rounded-full animate-spin mb-4"></div>
        <p className="text-[#5c4033] font-serif">Connecting roots...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 bg-[#fcfaf7]">
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-6">
          <button onClick={() => setCurrentState(AppState.DASHBOARD)} className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-[#5c4033] rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
              <span className="text-white font-serif font-bold text-xl">R</span>
            </div>
            <span className="text-[#5c4033] font-serif text-2xl font-bold tracking-tight">Raíz</span>
          </button>
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-white rounded-full border border-[#d2b48c]/20 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'success' ? 'bg-green-500' : syncStatus === 'error' ? 'bg-red-500' : syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{syncStatus === 'error' ? 'Sync Error' : userId ? 'Cloud Sync Active' : 'Offline Mode'}</span>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center space-x-6">
            <span className="text-xs font-bold text-[#5c4033] uppercase tracking-wider bg-[#d2b48c]/20 px-3 py-1 rounded-full">{currentUser.name}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-xs font-bold text-[#c27e5d] uppercase tracking-wider hover:text-[#5c4033] transition-colors">Logout</button>
          </div>
        )}
      </header>

      <main className="relative z-10">
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
    </div>
  );
};

export default App;
