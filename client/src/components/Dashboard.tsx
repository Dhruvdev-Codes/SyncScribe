import React, { useState, useEffect } from 'react';
import { DocumentItem } from '../types';
import { documentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Trash2,
  Copy,
  Calendar,
  Sun,
  Moon,
  Settings,
  BookOpen,
} from 'lucide-react';

interface DashboardProps {
  onSelectDocument: (id: string) => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectDocument,
  onOpenTemplates,
  onOpenSettings,
}) => {
  const { theme, toggleTheme, user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const tag = selectedTag !== 'all' ? selectedTag : undefined;
      const data = await documentApi.getAll(searchQuery || undefined, tag);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleCreateNew = async () => {
    try {
      const newDoc = await documentApi.create({
        title: 'Untitled Document',
        content: '<h1>Untitled Document</h1><p>Start collaborating in real-time or press <strong>Ctrl+K</strong> for AI suggestions.</p>',
        plainText: 'Untitled Document\nStart collaborating in real-time or press Ctrl+K for AI suggestions.',
        icon: '📝',
        tags: ['general'],
      });
      onSelectDocument(newDoc.id);
    } catch (err) {
      console.error('Failed to create new document:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentApi.delete(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dup = await documentApi.duplicate(id);
      setDocuments((prev) => [dup, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const allTags = ['all', 'general', 'product', 'engineering', 'ideation', 'guide'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400 bg-clip-text text-transparent">
              SyncScribe
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Real-Time AI Collaborative Docs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user.color }}></div>
            <span>{user.name}</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl mb-10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Collaborative Workspace
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">
              Write, Brainstorm & Sync at the Speed of Thought.
            </h2>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">
              Experience seamless multiplayer editing, live presence, revision time-travel, and an ambient AI Copilot that turns ideas into polished documents instantly.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-600 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> New Document
              </button>
              <button
                onClick={onOpenTemplates}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm rounded-xl border border-white/20 transition-all"
              >
                <BookOpen className="w-4 h-4" /> Template Gallery
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-slate-100"
            />
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-1">No documents found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
              Create your first real-time document or pick from our pre-designed templates to start writing.
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Create Document
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => {
              let tagsArray: string[] = [];
              try {
                tagsArray = Array.isArray(doc.tags) ? doc.tags : JSON.parse(doc.tags || '[]');
              } catch {
                tagsArray = ['general'];
              }

              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl select-none group-hover:scale-110 transition-transform">
                        {doc.icon || '📝'}
                      </span>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === doc.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 animate-fade-in">
                            <button
                              onClick={(e) => handleDuplicate(doc.id, e)}
                              className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                              <Copy className="w-3.5 h-3.5 text-brand-500" /> Duplicate
                            </button>
                            <button
                              onClick={(e) => handleDelete(doc.id, e)}
                              className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors line-clamp-1 mb-1">
                      {doc.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {doc.plainText ? doc.plainText.substring(0, 100) : 'Empty document...'}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tagsArray.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span>v{doc.version || 1}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {viewMode === 'list' && documents.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{doc.icon || '📝'}</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{doc.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {doc.plainText ? doc.plainText.substring(0, 80) : 'No content'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
