import React, { useState, FormEvent } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Mail, Lock, ArrowRight, TerminalSquare, PenLine } from 'lucide-react';
import { VantaHaloBackground } from '../components/VantaHaloBackground';

export const LoginPage: React.FC = () => {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated && (user as any).role !== 'developer') {
    return <Navigate to="/" replace />;
  }

  const handleDemoLogin = () => {
    login(
      {
        id: 'demo-user-1',
        name: 'Dhruv Sharma',
        email: 'demo@syncscribe.dev',
        role: 'user',
        avatar: '🚀',
        color: '#3b82f6',
      },
      'demo-jwt-token'
    );
    navigate('/');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      // If backend is offline or unreachable, offer instant guest access
      if (!err.response) {
        setError('Backend is offline. You can continue as a Guest Demo collaborator.');
      } else {
        setError(err.response?.data?.error || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <VantaHaloBackground
      backgroundColor={0x020617}
      baseColor={0x2563eb}
      size={1.1}
      className="min-h-screen flex items-center justify-center p-4 bg-slate-950"
    >
      <div className="relative z-10 w-full max-w-md py-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
              <PenLine size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-300 text-sm mt-1.5">Sign in to continue to SyncScribe</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/60 p-8 space-y-6 text-white">
          {error && (
            <div className="px-4 py-3 bg-red-950/60 text-red-300 text-sm rounded-2xl border border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500" />
                Remember me
              </label>
              <Link to="#" className="text-brand-400 hover:text-brand-300 font-medium">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition"
            >
              🚀 Explore Live Demo Workspace
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-slate-900 text-slate-400">or</span></div>
          </div>

          <p className="text-center text-sm text-slate-300">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-semibold">Sign up free</Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/dev/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition">
            <TerminalSquare size={16} />
            Developer Portal
          </Link>
        </div>
      </div>
    </VantaHaloBackground>
  );
};

export default LoginPage;