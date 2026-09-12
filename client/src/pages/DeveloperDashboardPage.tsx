import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LogOut, Database, Activity, GitBranch, Package, FileText, Users,
  CheckCircle2, XCircle, Clock, ArrowLeft, Terminal
} from 'lucide-react';

interface DevStats {
  projects?: number;
  documents?: number;
  users?: number;
  activityToday?: number;
  [key: string]: any;
}

interface DevActivityItem {
  id: string;
  developerName: string;
  actionType: string;
  description: string;
  status: string;
  createdAt: string;
}

export const DeveloperDashboardPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DevStats | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [activities, setActivities] = useState<DevActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isDev = isAuthenticated && (user as any).role === 'developer';

  useEffect(() => {
    if (!isDev) return;
    const loadData = async () => {
      try {
        const [statsRes, detailsRes, activitiesRes] = await Promise.all([
          api.get('/dev/stats'),
          api.get('/dev/details'),
          api.get('/dev/activities'),
        ]);
        setStats(statsRes.data);
        setSystemInfo(detailsRes.data);
        setActivities((activitiesRes.data as DevActivityItem[]).slice(0, 10));
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to load developer data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isDev]);

  if (!isDev) {
    return <Navigate to="/dev/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/dev/login');
  };

  const statCards = [
    { label: 'Documents', value: stats?.documents ?? '—', icon: FileText, color: 'text-brand-400' },
    { label: 'Total Users', value: stats?.users ?? '—', icon: Users, color: 'text-emerald-400' },
    { label: 'Projects', value: stats?.projects ?? '—', icon: Package, color: 'text-purple-400' },
    { label: 'Activity Today', value: stats?.activityToday ?? '—', icon: Activity, color: 'text-cyan-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Terminal className="text-cyan-400" size={18} />
            </div>
            <div>
              <h1 className="font-mono font-bold text-sm">DIAGNOSTIC</h1>
              <p className="text-[10px] text-slate-500 font-mono">Developer Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
              ● {user?.name || 'Developer'}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-700/50 text-slate-400 hover:text-red-400 transition text-xs font-mono"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-mono">System Overview</h2>
            <p className="text-slate-500 text-sm font-mono mt-1">Realtime telemetry &amp; database activity</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition font-mono">
            <ArrowLeft size={14} /> Back to App
          </Link>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-950/60 text-red-400 text-sm rounded-2xl border border-red-800 font-mono">
            $ {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-mono text-sm">Fetching telemetry...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-500">{card.label}</span>
                    <card.icon className={card.color} size={18} />
                  </div>
                  <div className="text-3xl font-bold font-mono">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dev Activities */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <GitBranch className="text-emerald-400" size={16} />
                  <h3 className="font-mono font-bold text-sm">Recent Dev Activity</h3>
                </div>
                <div className="space-y-3">
                  {activities.length === 0 && (
                    <p className="text-slate-500 text-sm font-mono">No activity logged yet.</p>
                  )}
                  {activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      {act.status === 'completed' ? (
                        <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={14} />
                      ) : act.status === 'in-progress' ? (
                        <Clock className="text-amber-400 shrink-0 mt-0.5" size={14} />
                      ) : (
                        <XCircle className="text-red-400 shrink-0 mt-0.5" size={14} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-slate-200 truncate">{act.description}</p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {act.actionType} · {act.developerName} · {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database / System Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Database className="text-cyan-400" size={16} />
                  <h3 className="font-mono font-bold text-sm">System Details</h3>
                </div>
                {systemInfo ? (
                  <div className="space-y-2 font-mono text-sm">
                    {Object.entries(systemInfo)
                      .filter(([k]) => !['__v', '_id'].includes(k))
                      .slice(0, 12)
                      .map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-4 border-b border-slate-800/50 pb-2">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-slate-300 text-right break-all max-w-[60%]">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm font-mono">No system details available.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DeveloperDashboardPage;