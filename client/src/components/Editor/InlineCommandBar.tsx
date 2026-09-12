import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { aiApi } from '../../services/api';
import {
  Sparkles,
  Send,
  X,
  ListOrdered,
  FileText,
  HelpCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const InlineCommandBar: React.FC = () => {
  const { activeModal, setActiveModal, applyAIText, document } = useDocument();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetAction, setTargetAction] = useState<'insert' | 'append' | 'replace'>('insert');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'ai-prompt') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [activeModal]);

  if (activeModal !== 'ai-prompt') return null;

  const handleGenerate = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    if (!query.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await aiApi.generate({
        prompt: query,
        context: document?.plainText || '',
        mode: 'generate',
      });

      if (res && res.text) {
        applyAIText(res.text, targetAction);
        setActiveModal(null);
        setPrompt('');
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    { label: 'Draft Project Roadmap', icon: TrendingUp, query: 'Draft a clear 3-phase project roadmap with timelines and milestones' },
    { label: 'Summarize Key Takeaways', icon: FileText, query: 'Summarize the core takeaways and executive summary for this document' },
    { label: 'Action Items & Next Steps', icon: ListOrdered, query: 'Extract and format clear action items with owners and deadlines' },
    { label: 'FAQ Section', icon: HelpCircle, query: 'Generate a 4-question FAQ section addressing common questions' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Input Header */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Ask AI to write, outline, draft, or brainstorm anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerate();
              if (e.key === 'Escape') setActiveModal('none');
            }}
            className="flex-1 bg-transparent border-none text-sm focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 transition-all"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setActiveModal('none')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Insertion Mode */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Placement:</span>
          <div className="flex items-center gap-2">
            {(['insert', 'append', 'replace'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTargetAction(mode)}
                className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-colors ${
                  targetAction === mode
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {mode === 'insert' ? 'At Cursor' : mode === 'append' ? 'End of Doc' : 'Replace All'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="p-3 bg-white dark:bg-slate-900">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 px-1 uppercase tracking-wider">
            Quick Prompts
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleGenerate(item.query)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-500">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
