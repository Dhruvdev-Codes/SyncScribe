import React, { useState, FormEvent } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Terminal, Lock, Mail, ArrowRight, ShieldCheck, GitBranch, Database, Activity } from 'lucide-react';
import { VantaHaloBackground } from '../components/VantaHaloBackground';

export const DeveloperLoginPage: React.FC = () => {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated && (user as any).role === 'developer') {
    return <Navigate to="/dev/dashboard" replace />;
  }

  const handleDemoDevLogin = () => {
    login(
      {
        id: 'dev-demo-1',
        name: 'Lead Architect (Dev)',
        email: 'dev@syncscribe.dev',
        role: 'developer',
        avatar: '⚡',
        color: '#06b6d4',
      },
      'demo-dev-jwt-token'
    );
    navigate('/dev/dashboard');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login/developer', { email, password });
      login(data.user, data.token);
      navigate('/dev/dashboard');
    } catch (err: any) {
      if (!err.response) {
        handleDemoDevLogin();
      } else {
        setError(err.response?.data?.error || 'Access denied or invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <VantaHaloBackground
      backgroundColor={0x020617}
      baseColor={0x0891b2}
      size={1.15}
      className="min-h-screen flex items-center justify-center p-4 bg-slate-950"
    >
      <div className="relative z-10 w-full max-w-md py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-2xl shadow-lg shadow-cyan-500/10">
            <Terminal className="text-cyan-400" size={18} />
            <span className="text-cyan-400 font-mono text-xs font-semibold tracking-wider">DEV CONSOLE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-mono tracking-tight">Secure Dev Access</h1>
          <p className="text-slate-300 mt-1.5 font-mono text-xs">Unlock telemetry &amp; live platform telemetry</p>
        </div>

        <div className="bg-slate-950/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-cyan-500/30 p-8 space-y-6">
          {error && (
            <div className="px-4 py-3 bg-red-950/70 text-red-300 text-sm rounded-2xl border border-red-800 font-mono">
              $ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 font-mono">Developer Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@syncscribe.dev"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <ShieldCheck className="text-emerald-400 shrink-0" size={16} />
              <p className="text-xs text-slate-400 font-mono">Role-locked: developer or admin credentials required</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoDevLogin}
              className="w-full py-2.5 px-4 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 text-cyan-300 font-mono text-xs transition"
            >
              $ bypass --role=developer (Demo Portal)
            </button>
          </form>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-1 p-3 bg-slate-900/70 rounded-xl border border-slate-800">
              <Database className="text-cyan-400" size={16} />
              <span className="text-[10px] text-slate-400 font-mono">DB Logs</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-slate-900/70 rounded-xl border border-slate-800">
              <Activity className="text-purple-400" size={16} />
              <span className="text-[10px] text-slate-400 font-mono">Telemetry</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-slate-900/70 rounded-xl border border-slate-800">
              <GitBranch className="text-emerald-400" size={16} />
              <span className="text-[10px] text-slate-400 font-mono">Git Ops</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-400 hover:text-slate-200 transition font-mono text-xs">
            ← Back to User Login
          </Link>
        </div>
      </div>
    </VantaHaloBackground>
  );
};

export default DeveloperLoginPage;