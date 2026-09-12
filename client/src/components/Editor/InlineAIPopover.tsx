import React, { useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { aiApi } from '../../services/api';
import {
  Sparkles,
  CheckCheck,
  Minimize2,
  Maximize2,
  Briefcase,
  Smile,
  Globe,
  MessageSquarePlus,
  RefreshCw,
} from 'lucide-react';

export const InlineAIPopover: React.FC = () => {
  const {
    selectedTextForAI,
    aiSelectionPosition,
    applyAIText,
    setAISelection,
    addComment,
    document,
  } = useDocument();

  const [isLoading, setIsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  if (!aiSelectionPosition || !selectedTextForAI.trim()) {
    return null;
  }

  const handleAction = async (mode: string, tone?: string) => {
    setIsLoading(true);
    try {
      const res = await aiApi.rewrite({
        text: selectedTextForAI,
        mode,
        tone,
        context: document?.plainText || '',
      });
      if (res && res.text) {
        applyAIText(res.text, 'replace');
        setAISelection('', null);
      }
    } catch (err) {
      console.error('AI rewrite failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (targetLanguage: string) => {
    setIsLoading(true);
    setShowTranslateMenu(false);
    try {
      const res = await aiApi.translate(selectedTextForAI, targetLanguage);
      if (res && res.translatedText) {
        applyAIText(res.translatedText, 'replace');
        setAISelection('', null);
      }
    } catch (err) {
      console.error('AI translate failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await addComment(commentInput.trim(), selectedTextForAI);
    setCommentInput('');
    setShowCommentInput(false);
    setAISelection('', null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: Math.max(70, aiSelectionPosition.top - 52),
        left: Math.max(20, Math.min(window.innerWidth - 380, aiSelectionPosition.left - 100)),
        zIndex: 40,
      }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1.5 flex flex-col gap-1.5 animate-fade-in text-slate-800 dark:text-slate-200"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>AI is working on your selection...</span>
        </div>
      ) : showCommentInput ? (
        <form onSubmit={handleAddCommentSubmit} className="flex items-center gap-2 p-1">
          <input
            type="text"
            placeholder="Add inline comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            autoFocus
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 w-56"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold"
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => setShowCommentInput(false)}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </form>
      ) : showTranslateMenu ? (
        <div className="flex items-center gap-1 p-1">
          {['Spanish', 'French', 'German', 'Japanese', 'Hindi'].map((lang) => (
            <button
              key={lang}
              onClick={() => handleTranslate(lang)}
              className="px-2 py-1 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              {lang}
            </button>
          ))}
          <button
            onClick={() => setShowTranslateMenu(false)}
            className="text-xs text-slate-400 px-1 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-wrap max-w-sm">
          <button
            onClick={() => handleAction('fix-grammar')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Fix grammar & spelling"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Fix Grammar</span>
          </button>

          <button
            onClick={() => handleAction('rewrite', 'formal')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Make formal and professional"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            <span>Formal</span>
          </button>

          <button
            onClick={() => handleAction('rewrite', 'casual')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Make friendly and casual"
          >
            <Smile className="w-3.5 h-3.5 text-amber-500" />
            <span>Casual</span>
          </button>

          <button
            onClick={() => handleAction('shorten')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Make shorter and concise"
          >
            <Minimize2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Shorter</span>
          </button>

          <button
            onClick={() => handleAction('expand')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Expand with more detail"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Expand</span>
          </button>

          <button
            onClick={() => setShowTranslateMenu(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Translate selection"
          >
            <Globe className="w-3.5 h-3.5 text-teal-500" />
          </button>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

          <button
            onClick={() => setShowCommentInput(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
            title="Add inline comment on this text"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>
        </div>
      )}
    </div>
  );
};
