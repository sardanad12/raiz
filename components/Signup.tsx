
import React, { useState } from 'react';
import { User } from '../types';

interface SignupProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Simulated "Backend" registration
    const users = JSON.parse(localStorage.getItem('raiz_users') || '[]');
    
    if (users.some((u: any) => u.email === email)) {
      setError('This email is already registered.');
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('raiz_users', JSON.stringify(users));

    const userData: User = { name, email };
    localStorage.setItem('raiz_session', JSON.stringify(userData));
    onSignup(userData);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#d2b48c]/20">
        <h2 className="text-3xl font-serif text-[#5c4033] mb-2 text-center">Create Account</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Begin your language reconnection journey.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#5c4033] uppercase tracking-wider mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#d2b48c]/30 focus:outline-none focus:border-[#2d5a27] transition-colors"
              placeholder="What should we call you?"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#5c4033] uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#d2b48c]/30 focus:outline-none focus:border-[#2d5a27] transition-colors"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5c4033] uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#d2b48c]/30 focus:outline-none focus:border-[#2d5a27] transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#2d5a27] text-white py-4 rounded-xl font-bold hover:bg-[#23471f] transition-all shadow-md transform active:scale-95"
          >
            Join Raíz
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="text-[#5c4033] font-bold hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
