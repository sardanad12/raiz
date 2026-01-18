
import React from 'react';
import { LANGUAGES, PERSONAS } from '../constants';
import { Language, Persona } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onSelectLanguage: (lang: Language) => void;
  selectedPersona: Persona | null;
  onSelectPersona: (persona: Persona) => void;
  onStart: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  selectedPersona,
  onSelectPersona,
  onStart,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-[#5c4033] mb-4">Raíz</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
          Reconnect with your heritage. Practice your family's language in a safe space, 
          rediscovering your voice one word at a time.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold text-[#5c4033] mb-6 border-b border-[#d2b48c] pb-2">1. Choose your language</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelectLanguage(lang)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
                selectedLanguage?.code === lang.code
                  ? 'border-[#2d5a27] bg-[#2d5a27]/5'
                  : 'border-[#d2b48c]/30 hover:border-[#2d5a27]/50'
              }`}
            >
              <span className="text-3xl mb-2">{lang.flag}</span>
              <span className="font-bold text-[#5c4033]">{lang.nativeName}</span>
              <span className="text-xs text-gray-500">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold text-[#5c4033] mb-6 border-b border-[#d2b48c] pb-2">2. Who are you speaking with?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedPersona?.id === p.id
                  ? 'border-[#c27e5d] bg-[#c27e5d]/5'
                  : 'border-[#d2b48c]/30 hover:border-[#c27e5d]/50'
              }`}
            >
              <h3 className="font-bold text-[#5c4033] mb-1">{p.name}</h3>
              <p className="text-sm text-[#c27e5d] font-medium mb-2">{p.role}</p>
              <p className="text-xs text-gray-600 leading-snug">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <button
          onClick={onStart}
          disabled={!selectedLanguage || !selectedPersona}
          className={`px-12 py-4 rounded-full font-bold text-lg transition-all shadow-lg transform active:scale-95 ${
            selectedLanguage && selectedPersona
              ? 'bg-[#2d5a27] text-white hover:bg-[#23471f] hover:-translate-y-1'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Begin Your Session
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
