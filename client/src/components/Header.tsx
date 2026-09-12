import React, { useState } from 'react';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  MessageSquare,
  History,
  Share2,
  Download,
  Moon,
  Sun,
  Settings,
  ChevronLeft,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileText,
  FileCode,
  File,
  Printer,
  ListOrdered,
  BotMessageSquare,
} from 'lucide-react';
import { documentApi } from '../services/api';

interface HeaderProps {
  onBackToDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBackToDashboard }) => {
  const {
    document,
    updateDocumentTitle,
    saveStatus,
    activeUsers,
    comments,
    chatMessages,
    activeDrawer,
    setActiveDrawer,
    setActiveModal,
  } = useDocument();

  const { theme, toggleTheme, user } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(document?.title || 'Untitled Document');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const unresolvedComments = comments.filter((c) => !c.resolved).length;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput !== document?.title) {
      updateDocumentTitle(titleInput.trim());
    }
  };

  const handleExport = (format: 'markdown' | 'html' | 'txt') => {
    setShowExportMenu(false);
    if (document) {
      const url = documentApi.getExportUrl(document.id, format);
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToDashboard}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1 text-sm font-medium"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Docs</span>
        </button>

        <span className="text-2xl select-none">{document?.icon || '📝'}</span>

        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="text-lg font-bold bg-transparent border-b-2 border-brand-500 focus:outline-none text-slate-900 dark:text-slate-100 px-1 py-0.5"
          />
        ) : (
          <h1
            onClick={() => {
              setTitleInput(document?.title || '');
              setIsEditingTitle(true);
            }}
            className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded cursor-pointer transition-colors max-w-[200px] sm:max-w-[320px] truncate"
            title="Click to rename"
          >
            {document?.title || 'Untitled Document'}
          </h1>
        )}

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2">
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Sync Error</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center -space-x-2 mr-2">
          {activeUsers.map((u) => (
            <div
              key={u.id}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ring-2 ring-white dark:ring-slate-900 shadow-sm transition-transform hover:scale-110 cursor-pointer"
              style={{ backgroundColor: u.color }}
              title={`${u.name} ${u.id === user.id ? '(You)' : ''}`}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'outline' ? 'none' : 'outline')}
          className={`p-2 rounded-lg transition-colors ${
            activeDrawer === 'outline'
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Document Outline"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'copilot' ? 'none' : 'copilot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
            activeDrawer === 'copilot'
              ? 'bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-brand-500/20'
              : 'bg-gradient-to-r from-purple-500/10 to-brand-500/10 hover:from-purple-500/20 hover:to-brand-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
          }`}
          title="Toggle AI Copilot"
        >
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'comments' ? 'none' : 'comments')}
          className={`relative p-2 rounded-lg transition-colors ${
            activeDrawer === 'comments'
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Comments"
        >
          <MessageSquare className="w-4 h-4" />
          {unresolvedComments > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unresolvedComments}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'chat' ? 'none' : 'chat')}
          className={`relative p-2 rounded-lg transition-colors ${
            activeDrawer === 'chat'
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Live Team Chat"
        >
          <BotMessageSquare className="w-4 h-4" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {chatMessages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'versions' ? 'none' : 'versions')}
          className={`p-2 rounded-lg transition-colors ${
            activeDrawer === 'versions'
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Version History & Snapshots"
        >
          <History className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Export Document"
          >
            <Download className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Export Format</div>
              <button
                onClick={() => handleExport('markdown')}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <FileCode className="w-4 h-4 text-brand-500" />
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport('html')}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                HTML Document (.html)
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <File className="w-4 h-4 text-slate-500" />
                Plain Text (.txt)
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button
                onClick={handlePrint}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Printer className="w-4 h-4 text-purple-500" />
                Print / Save as PDF
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveModal('share')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <button
          onClick={() => setActiveModal('settings')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
