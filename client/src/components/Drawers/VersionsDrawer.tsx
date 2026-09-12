import React, { useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { History, X, Plus, RotateCcw, Clock, User, CheckCircle2 } from 'lucide-react';

export const VersionsDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    versions,
    document,
    createSnapshot,
    restoreSnapshot,
  } = useDocument();

  const [summaryInput, setSummaryInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (activeDrawer !== 'versions') return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createSnapshot(summaryInput.trim() || 'Manual Snapshot');
      setSummaryInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (window.confirm('Restore document to this version? Current changes will be archived.')) {
      setRestoringId(versionId);
      try {
        await restoreSnapshot(versionId);
      } catch (err) {
        console.error(err);
      } finally {
        setRestoringId(null);
      }
    }
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-4rem)] z-30 animate-fade-in shadow-xl">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-500" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Version History</h3>
            <p className="text-[10px] text-slate-400">Time-travel & restore points</p>
          </div>
        </div>

        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Create snapshot button / form */}
      <form onSubmit={handleCreate} className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
        <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Save Current State</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Version title / summary..."
            value={summaryInput}
            onChange={(e) => setSummaryInput(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Snapshot
          </button>
        </div>
      </form>

      {/* Version timeline list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {versions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No saved versions yet</p>
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={ver.id}
                className={`p-3 rounded-2xl border transition-all relative ${
                  isCurrent
                    ? 'bg-brand-500/5 border-brand-500/30'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      v{ver.versionNumber}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Current
                      </span>
                    )}
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleRestore(ver.id)}
                      disabled={restoringId === ver.id}
                      className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {ver.changeSummary || 'Autosave snapshot'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ver.authorName || 'Collaborator'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

