import React, { useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { Share2, X, Copy, Check, Globe, Lock, Users } from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { activeModal, setActiveModal, document, collaborators, updateDocumentMetadata } = useDocument();
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'share' || !document) return null;

  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTogglePublic = () => {
    updateDocumentMetadata({ isPublic: !document.isPublic });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-500">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Share Document</h3>
              <p className="text-[10px] text-slate-400">Collaborate with your team in real time</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Link Copy Bar */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
              Document Live Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 select-all"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {document.isPublic ? (
                <Globe className="w-4 h-4 text-emerald-500" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {document.isPublic ? 'Public workspace' : 'Private link only'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {document.isPublic ? 'Anyone with the link can edit' : 'Only invited members'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePublic}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                document.isPublic
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {document.isPublic ? 'Public' : 'Make Public'}
            </button>
          </div>

          {/* Active online viewers */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Active in this session ({collaborators.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-medium">Active now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
