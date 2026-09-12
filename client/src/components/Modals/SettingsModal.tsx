import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAISettings, saveAISettings, AISettings } from '../../services/aiService';
import { Settings, X, User, Palette, Cpu, Check, Sun, Moon, Sparkles, Key, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, theme, toggleTheme } = useAuth();
  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.color);
  const [avatar, setAvatar] = useState(user.avatar || '👩💻');
  const [aiSettings, setAiSettings] = useState<AISettings>({ provider: 'auto' });
  const [activeTab, setActiveTab] = useState<'profile' | 'ai'>('profile');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setColor(user.color);
      setAvatar(user.avatar || '👩💻');
      setAiSettings(getAISettings());
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const colorPalette = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  const avatarOptions = ['👩💻', '👨💻', '🚀', '🧙♂️', '🦊', '⚡', '🦉', '👾'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: name.trim() || 'Anonymous Writer', color, avatar });
    saveAISettings(aiSettings);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };


  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Preferences</h3>
              <p className="text-[10px] text-slate-400">Manage identity, AI models & workspace settings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 bg-slate-50/50 dark:bg-slate-800/30 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Identity & Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ai' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Engine & Models
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Display Name
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">
                  Multiplayer Presence Color
                </label>
                <div className="flex items-center gap-2">
                  {colorPalette.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white ${
                        color === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2' : 'hover:scale-110'
                      }`}
                    >
                      {color === c && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">
                  Avatar Icon
                </label>
                <div className="flex items-center gap-2">
                  {avatarOptions.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setAvatar(av)}
                      className={`text-xl p-1.5 rounded-xl transition-all ${
                        avatar === av
                          ? 'bg-brand-500/20 border-2 border-brand-500 scale-110'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Appearance</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent border border-brand-500/20 flex items-start gap-3">
                <Zap className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Live AI Engine Active</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    SyncScribe uses real generative AI to write, answer questions, draft roadmaps, summarize documents, and translate text instantly.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  AI Provider Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'auto', name: '✨ Auto Cloud AI', desc: 'Free, no API key needed' },
                    { id: 'gemini', name: '⚡ Google Gemini', desc: 'Fast Gemini 1.5 Flash' },
                    { id: 'openai', name: '🧠 OpenAI GPT', desc: 'GPT-4o / GPT-3.5' },
                    { id: 'offline', name: '🛡️ Offline Smart', desc: 'Local semantic engine' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAiSettings((prev) => ({ ...prev, provider: p.id as any }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        aiSettings.provider === p.id
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-bold">{p.name}</p>
                      <p className="text-[10px] opacity-75">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {aiSettings.provider === 'gemini' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Google Gemini API Key</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-brand-500 hover:underline"
                    >
                      Get Free Key →
                    </a>
                  </label>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={aiSettings.geminiKey || ''}
                      onChange={(e) => setAiSettings((prev) => ({ ...prev, geminiKey: e.target.value }))}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {aiSettings.provider === 'openai' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>OpenAI API Key</span>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-brand-500 hover:underline"
                    >
                      Get Key →
                    </a>
                  </label>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={aiSettings.openaiKey || ''}
                      onChange={(e) => setAiSettings((prev) => ({ ...prev, openaiKey: e.target.value }))}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{isSaved ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
