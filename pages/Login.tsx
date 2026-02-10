import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Icons } from '../components/Icon';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

type AuthView = 'login' | 'signup' | 'reset';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Clear messages when switching views
    setError('');
    setSuccessMessage('');
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.signIn(email, password);
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.signUp({ email, password, username });
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.user) {
        setSuccessMessage('Account created successfully! Please check your email for confirmation.');
        // Optionally auto-login or redirect to login
        setTimeout(() => {
          setView('login');
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.resetPassword(email);
      
      if (response.error) {
        setError(response.error.message);
      } else {
        setSuccessMessage('Password reset email sent! Please check your inbox.');
        setTimeout(() => {
          setView('login');
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          placeholder="Enter your password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-800 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Signing In...
          </div>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setView('reset')}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setView('signup')}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </form>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp} className="space-y-6">
      <div>
        <label htmlFor="signup-username" className="block text-sm font-medium text-gray-300 mb-2">
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          placeholder="Choose a username"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          placeholder="Create a password (min 6 characters)"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-800 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Creating Account...
          </div>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="text-center pt-4">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setView('login')}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );

  const renderResetPassword = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          placeholder="Enter your email"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-800 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Sending Email...
          </div>
        ) : (
          'Send Reset Link'
        )}
      </button>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={() => setView('login')}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-cyan-600 rounded-2xl mb-4 shadow-xl shadow-primary-900/30">
            <Icons.Message className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {view === 'login' && 'Welcome Back'}
            {view === 'signup' && 'Create Account'}
            {view === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-gray-400">
            {view === 'login' && 'Sign in to your account'}
            {view === 'signup' && 'Join our community today'}
            {view === 'reset' && 'We\'ll send you a link to reset your password'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl backdrop-blur-sm">
            <div className="flex items-start">
              <Icons.Close className="text-red-400 mr-2 mt-0.5" size={16} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-xl backdrop-blur-sm">
            <div className="flex items-start">
              <Icons.Check className="text-green-400 mr-2 mt-0.5" size={16} />
              <p className="text-green-300 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="backdrop-blur-xl bg-dark-surface/40 border border-dark-border/50 rounded-2xl p-6 shadow-2xl">
          {view === 'login' && renderLogin()}
          {view === 'signup' && renderSignUp()}
          {view === 'reset' && renderResetPassword()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Secure authentication powered by Supabase</p>
        </div>
      </div>
    </div>
  );
};

export default Login;