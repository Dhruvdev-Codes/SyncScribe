import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, X, Send } from 'lucide-react';

export const ChatDrawer: React.FC = () => {
  const { activeDrawer, setActiveDrawer, chatMessages, sendChatMessage, collaborators } = useDocument();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDrawer === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeDrawer]);

  if (activeDrawer !== 'chat') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText.trim());
    setInputText('');
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-4rem)] z-30 animate-fade-in shadow-xl">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Workspace Chat</h3>
          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
            {collaborators.length} online
          </span>
        </div>

        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No messages yet. Say hello!</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.userId === user.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-1 px-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: msg.userColor }}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {isMe ? 'You' : msg.userName}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[85%] shadow-xs break-words ${
                    isMe
                      ? 'bg-brand-500 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-500">
          <input
            type="text"
            placeholder="Type a team message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
