
import React, { useState } from 'react';
import { IdentityProfile } from '../types';

interface SurveyProps {
  onComplete: (profile: IdentityProfile) => void;
}

const Survey: React.FC<SurveyProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [formData, setFormData] = useState<IdentityProfile>({
    heritageTitle: '',
    primaryDialect: '',
    culturalGoal: '',
    userOrigin: '',
    parentsOrigin: '',
    motivation: '',
    accentStyle: ''
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const finish = () => {
    setIsFinishing(true);
    onComplete({
      ...formData,
      heritageTitle: `${formData.userOrigin} heritage with ${formData.parentsOrigin} roots`
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#d2b48c]/20 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#d2b48c]/10">
          <div 
            className="h-full bg-[#2d5a27] transition-all duration-500" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <span className="text-4xl mb-4 block">🌱</span>
              <h2 className="text-3xl font-serif text-[#5c4033] mb-2">Planting the Seeds</h2>
              <p className="text-gray-500 text-sm">Tell us about the map of your journey.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest block mb-2">Where were you born/raised?</label>
                <input 
                  className="w-full bg-[#fcfaf7] p-4 rounded-2xl border border-[#d2b48c]/30 focus:border-[#2d5a27] outline-none"
                  placeholder="e.g. Haryana, India or Chicago, USA"
                  value={formData.userOrigin}
                  onChange={e => setFormData({...formData, userOrigin: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest block mb-2">Where are your parents/ancestors from?</label>
                <input 
                  className="w-full bg-[#fcfaf7] p-4 rounded-2xl border border-[#d2b48c]/30 focus:border-[#2d5a27] outline-none"
                  placeholder="e.g. Rohtak District or Michoacán, Mexico"
                  value={formData.parentsOrigin}
                  onChange={e => setFormData({...formData, parentsOrigin: e.target.value})}
                />
              </div>
              <button 
                disabled={!formData.userOrigin || !formData.parentsOrigin}
                onClick={next} 
                className="w-full bg-[#5c4033] text-white py-4 rounded-2xl font-bold hover:bg-[#4a3429] transition-all disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <span className="text-4xl mb-4 block">🏡</span>
              <h2 className="text-3xl font-serif text-[#5c4033] mb-2">The Sound of Home</h2>
              <p className="text-gray-500 text-sm">Every family has a unique melody. How does yours sound?</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest block mb-2">Specific Dialect or Accent?</label>
                <p className="text-[10px] text-gray-400 mb-2 italic">e.g. "Jatt accent", "Southern Vietnamese", "Rural Mexican accent"</p>
                <input 
                  className="w-full bg-[#fcfaf7] p-4 rounded-2xl border border-[#d2b48c]/30 focus:border-[#2d5a27] outline-none"
                  placeholder="e.g. Jatt Haryanvi style"
                  value={formData.accentStyle}
                  onChange={e => setFormData({...formData, accentStyle: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#c27e5d] uppercase tracking-widest block mb-2">What is the primary goal for this reconnection?</label>
                <select 
                  className="w-full bg-[#fcfaf7] p-4 rounded-2xl border border-[#d2b48c]/30 focus:border-[#2d5a27] outline-none text-sm"
                  value={formData.culturalGoal}
                  onChange={e => setFormData({...formData, culturalGoal: e.target.value})}
                >
                  <option value="">Select a motivation...</option>
                  <option value="Talking to Elders">Talking with my Grandparents/Elders</option>
                  <option value="Heritage Identity">Feeling more connected to my identity</option>
                  <option value="Travel to Homeland">Visiting my ancestral homeland</option>
                  <option value="Passing to Children">Passing the language to the next generation</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button onClick={back} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold">Back</button>
                <button 
                  disabled={!formData.accentStyle || !formData.culturalGoal}
                  onClick={next} 
                  className="flex-[2] bg-[#5c4033] text-white py-4 rounded-2xl font-bold"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <span className="text-4xl mb-4 block">✨</span>
              <h2 className="text-3xl font-serif text-[#5c4033] mb-2">Your Motivation</h2>
              <p className="text-gray-500 text-sm">Why are you embarking on this journey now?</p>
            </div>
            <div className="space-y-6">
              <textarea 
                className="w-full bg-[#fcfaf7] p-4 rounded-2xl border border-[#d2b48c]/30 focus:border-[#2d5a27] outline-none min-h-[150px] text-sm leading-relaxed"
                placeholder="Share a story or a feeling... (e.g. 'I want to understand my grandpa's jokes before it's too late')"
                value={formData.motivation}
                onChange={e => setFormData({...formData, motivation: e.target.value})}
              ></textarea>
              <div className="flex gap-4">
                <button onClick={back} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold">Back</button>
                <button 
                  disabled={!formData.motivation || isFinishing}
                  onClick={finish} 
                  className="flex-[2] bg-[#2d5a27] text-white py-4 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isFinishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Finishing...
                    </>
                  ) : 'Finalize my Path'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Survey;
