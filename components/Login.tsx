
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20 animate-fade-in">
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
            disabled={loading}
            className="w-full bg-[#5c4033] text-white py-4 rounded-xl font-bold hover:bg-[#4a3429] transition-all shadow-md transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
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
