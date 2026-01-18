
import React, { useState } from 'react';
import { RootWord, IdentityProfile, Language } from '../types';
import { LANGUAGES } from '../constants';

interface HeritageAlbumProps {
  rootWords: RootWord[];
  profile: IdentityProfile;
  onUpdateProfile: (p: IdentityProfile) => void;
  onAddWord: (w: RootWord) => void;
  onBack: () => void;
}

const HeritageAlbum: React.FC<HeritageAlbumProps> = ({ rootWords, profile, onUpdateProfile, onAddWord, onBack }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', meaning: '', significance: '', lang: 'es' });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingProfile(false);
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word || !newWord.meaning) return;
    onAddWord({
      id: Date.now().toString(),
      word: newWord.word,
      meaning: newWord.meaning,
      culturalSignificance: newWord.significance,
      languageCode: newWord.lang
    });
    setNewWord({ word: '', meaning: '', significance: '', lang: 'es' });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
      <button onClick={onBack} className="text-[#c27e5d] font-bold mb-8 flex items-center gap-2 hover:translate-x-1 transition-transform">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#d2b48c]/20 sticky top-8">
            <h2 className="text-2xl font-serif text-[#5c4033] mb-6">Identity Roots</h2>
            
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#c27e5d] uppercase">How do you describe your identity?</label>
                  <input 
                    className="w-full bg-[#fcfaf7] p-3 rounded-xl border border-[#d2b48c]/30 text-sm"
                    value={profile.heritageTitle}
                    onChange={(e) => onUpdateProfile({...profile, heritageTitle: e.target.value})}
                    placeholder="e.g. Second Gen Filipino-American"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#c27e5d] uppercase">Home Dialect / Region</label>
                  <input 
                    className="w-full bg-[#fcfaf7] p-3 rounded-xl border border-[#d2b48c]/30 text-sm"
                    value={profile.primaryDialect}
                    onChange={(e) => onUpdateProfile({...profile, primaryDialect: e.target.value})}
                    placeholder="e.g. Ilocano / Manila"
                  />
                </div>
                <button type="submit" className="w-full bg-[#2d5a27] text-white py-3 rounded-xl font-bold">Save Roots</button>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest mb-1">Identity</p>
                  <p className="text-lg text-[#5c4033] font-medium">{profile.heritageTitle || "Not set yet"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest mb-1">Specific Dialect</p>
                  <p className="text-lg text-[#5c4033] font-medium">{profile.primaryDialect || "Generic"}</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs font-bold text-[#2d5a27] underline"
                >
                  Edit your story
                </button>
              </div>
            )}
            
            <div className="mt-12 p-6 bg-[#5c4033] rounded-2xl text-white">
              <p className="text-xs italic leading-relaxed opacity-90">
                "To speak a language is to take on a world, a culture."
              </p>
              <p className="text-[10px] mt-2 font-bold uppercase tracking-tighter">— Frantz Fanon</p>
            </div>
          </div>
        </div>

        {/* Main Content: Root Words Gallery */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif text-[#5c4033]">The Roots Gallery</h2>
            <p className="text-sm text-gray-500 italic">Words that hold the weight of home.</p>
          </div>

          {/* Add Word Form */}
          <div className="bg-[#fcfaf7] border-2 border-dashed border-[#d2b48c]/50 rounded-3xl p-8 mb-12">
            <h3 className="font-bold text-[#5c4033] mb-4">Add an 'Untranslatable' Gem</h3>
            <form onSubmit={handleAddWord} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                className="p-3 rounded-xl border border-[#d2b48c]/30 text-sm" 
                placeholder="The word (e.g. Sobremesa)"
                value={newWord.word}
                onChange={e => setNewWord({...newWord, word: e.target.value})}
              />
              <select 
                className="p-3 rounded-xl border border-[#d2b48c]/30 text-sm"
                value={newWord.lang}
                onChange={e => setNewWord({...newWord, lang: e.target.value})}
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
              <input 
                className="p-3 rounded-xl border border-[#d2b48c]/30 text-sm md:col-span-2" 
                placeholder="Literal English Meaning"
                value={newWord.meaning}
                onChange={e => setNewWord({...newWord, meaning: e.target.value})}
              />
              <textarea 
                className="p-3 rounded-xl border border-[#d2b48c]/30 text-sm md:col-span-2" 
                placeholder="What does this word mean to your family?"
                rows={2}
                value={newWord.significance}
                onChange={e => setNewWord({...newWord, significance: e.target.value})}
              ></textarea>
              <button className="md:col-span-2 bg-[#5c4033] text-white py-3 rounded-xl font-bold hover:bg-[#4a3429] transition-colors">Plant this Word</button>
            </form>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rootWords.length > 0 ? (
              rootWords.map(rw => (
                <div key={rw.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#d2b48c]/20 group hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl font-serif text-[#2d5a27] font-bold">{rw.word}</span>
                    <span className="text-lg">{LANGUAGES.find(l => l.code === rw.languageCode)?.flag}</span>
                  </div>
                  <p className="text-xs font-bold text-[#c27e5d] uppercase mb-2">Meaning: {rw.meaning}</p>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "{rw.culturalSignificance}"
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-20 text-center bg-white rounded-3xl border border-[#d2b48c]/10">
                <p className="text-gray-400 italic">Your gallery is quiet. Add words that connect you to your past.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeritageAlbum;
