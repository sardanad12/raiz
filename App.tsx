
import React, { useState, useEffect } from 'react';
import { AppState, Language, Persona, TranscriptionItem, User } from './types';
import LanguageSelector from './components/LanguageSelector';
import LiveConversation from './components/LiveConversation';
import FeedbackReport from './components/FeedbackReport';
import Login from './components/Login';
import Signup from './components/Signup';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sessionTranscriptions, setSessionTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Check for embed mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'true') {
      setIsEmbedded(true);
    }

    // Check for existing session
    const session = localStorage.getItem('raiz_session');
    if (session) {
      const user = JSON.parse(session);
      setCurrentUser(user);
      setCurrentState(AppState.ONBOARDING);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentState(AppState.ONBOARDING);
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
    setCurrentState(AppState.ONBOARDING);
  };

  const handleLogout = () => {
    localStorage.removeItem('raiz_session');
    setCurrentUser(null);
    setCurrentState(AppState.LOGIN);
    setSelectedLanguage(null);
    setSelectedPersona(null);
    setSessionTranscriptions([]);
  };

  const handleStartConversation = () => {
    if (selectedLanguage && selectedPersona) {
      setCurrentState(AppState.CONVERSATION);
    }
  };

  const handleEndConversation = (transcriptions: TranscriptionItem[]) => {
    setSessionTranscriptions(transcriptions);
    setCurrentState(AppState.EVALUATION);
  };

  const handleReset = () => {
    setCurrentState(AppState.ONBOARDING);
    setSessionTranscriptions([]);
  };

  return (
    <div className={`min-h-screen text-gray-800 selection:bg-[#d2b48c]/30 ${isEmbedded ? 'bg-transparent' : 'bg-[#fcfaf7]'}`}>
      {/* Decorative background elements - hidden in embed mode for cleaner integration */}
      {!isEmbedded && (
        <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#2d5a27] blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#c27e5d] blur-[120px]"></div>
        </div>
      )}

      {!isEmbedded && (
        <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-[#5c4033] rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
              <span className="text-white font-serif font-bold text-xl">R</span>
            </div>
            <span className="text-[#5c4033] font-serif text-2xl font-bold tracking-tight">Raíz</span>
          </button>
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex space-x-8 text-sm font-medium text-[#5c4033]">
              <a href="#" className="hover:text-[#2d5a27] transition-colors">Our Story</a>
              <a href="#" className="hover:text-[#2d5a27] transition-colors">Methodology</a>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold text-[#5c4033] uppercase tracking-wider bg-[#d2b48c]/20 px-3 py-1 rounded-full">
                  {currentUser.name}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-[#c27e5d] hover:text-[#a6684c] uppercase tracking-wider"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <main className={`relative z-10 ${isEmbedded ? 'pt-4' : 'pt-0'}`}>
        {currentState === AppState.LOGIN && (
          <Login 
            onLogin={handleLogin} 
            onSwitchToSignup={() => setCurrentState(AppState.SIGNUP)} 
          />
        )}

        {currentState === AppState.SIGNUP && (
          <Signup 
            onSignup={handleSignup} 
            onSwitchToLogin={() => setCurrentState(AppState.LOGIN)} 
          />
        )}

        {currentState === AppState.ONBOARDING && (
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            selectedPersona={selectedPersona}
            onSelectPersona={setSelectedPersona}
            onStart={handleStartConversation}
          />
        )}

        {currentState === AppState.CONVERSATION && selectedLanguage && selectedPersona && (
          <LiveConversation
            language={selectedLanguage}
            persona={selectedPersona}
            onEnd={handleEndConversation}
          />
        )}

        {currentState === AppState.EVALUATION && selectedLanguage && (
          <FeedbackReport
            language={selectedLanguage}
            transcriptions={sessionTranscriptions}
            onRestart={handleReset}
          />
        )}
      </main>

      {!isEmbedded && (
        <footer className="relative z-10 py-12 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Raíz Language Reconnection. Made for heritage speakers everywhere.</p>
        </footer>
      )}
    </div>
  );
};

export default App;
