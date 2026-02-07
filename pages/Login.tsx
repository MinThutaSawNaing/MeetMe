import React, { useState } from 'react';
import { Icons } from '../components/Icon';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    
    try {
      // Call the actual Supabase authentication
      await onLogin(username);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-black text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-primary-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-80 h-80 bg-green-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-primary-600 to-black border border-primary-900 rounded-3xl shadow-lg mb-6 shadow-primary-900/30 animate-pop">
                <Icons.Message size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight text-white">MeetMe</h1>
            <p className="text-gray-500">Secure. Fast. Midnight Ready.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-slide-up">
          <div className="relative">
            <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Pick a username"
              className="w-full bg-dark-surface border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder-gray-600"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!username || loading}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 border border-primary-500/20"
          >
            {loading ? 'Initializing...' : 'Get Started'}
            {!loading && <Icons.Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;