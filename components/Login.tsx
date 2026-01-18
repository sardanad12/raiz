
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Simulated "Backend" check
    const users = JSON.parse(localStorage.getItem('raiz_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      const userData: User = { name: user.name, email: user.email };
      localStorage.setItem('raiz_session', JSON.stringify(userData));
      onLogin(userData);
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#d2b48c]/20">
        <h2 className="text-3xl font-serif text-[#5c4033] mb-2 text-center">Welcome Back</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Continue your journey back to your roots.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
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
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#5c4033] text-white py-4 rounded-xl font-bold hover:bg-[#4a3429] transition-all shadow-md transform active:scale-95"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button 
              onClick={onSwitchToSignup}
              className="text-[#2d5a27] font-bold hover:underline"
            >
              Start growing here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
