import React, { useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  CheckCircle2,
  Circle,
  CornerDownRight,
  Filter,
} from 'lucide-react';

export const CommentsDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    comments,
    addComment,
    resolveComment,
    deleteComment,
  } = useDocument();
  const { user } = useAuth();

  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  if (activeDrawer !== 'comments') return null;

  const handleCreateGeneralComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await addComment(newCommentText.trim());
    setNewCommentText('');
  };

  const handleAddReply = async (commentId: string) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;
    await addComment(text.trim(), undefined, commentId);
    setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
  };

  const filteredComments = comments.filter((c) => {
    const isResolved = (c as any).resolved ?? c.isResolved;
    if (filter === 'open') return !isResolved;
    if (filter === 'resolved') return isResolved;
    return true;
  });

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-4rem)] z-30 animate-fade-in shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Comments ({comments.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            {(['open', 'resolved', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-colors ${
                  filter === mode
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveDrawer('none')}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Comment Input */}
      <form onSubmit={handleCreateGeneralComment} className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add a document comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="p-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredComments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No {filter} comments</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                comment.isResolved
                  ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              {comment.selectedText && (
                <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border-l-2 border-amber-500 text-[11px] text-amber-700 dark:text-amber-400 italic line-clamp-2">
                  "{comment.selectedText}"
                </div>
              )}

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: comment.authorColor }}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {comment.authorName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => resolveComment(comment.id, !comment.isResolved)}
                    className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                    title={comment.isResolved ? 'Mark open' : 'Mark resolved'}
                  >
                    {comment.isResolved ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">
                {comment.text}
              </p>
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-xs pl-2 border-l border-brand-500/40">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {reply.authorName}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {!comment.isResolved && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  {activeReplyId === comment.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyTextMap[comment.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [comment.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                        autoFocus
                        className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        className="p-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="text-xs text-slate-400 px-1 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReplyId(comment.id)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-500 font-medium"
                    >
                      <CornerDownRight className="w-3 h-3" /> Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
