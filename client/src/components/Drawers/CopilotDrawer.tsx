import React, { useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { aiApi } from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  Copy,
  ArrowDownToLine,
  FileText,
  ListOrdered,
  HelpCircle,
  Globe,
  Bot,
  User,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const CopilotDrawer: React.FC = () => {
  const { activeDrawer, setActiveDrawer, document, applyAIText } = useDocument();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your SyncScribe AI Copilot. Ask me anything about this document, or ask me to draft sections, summarize, and translate.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (activeDrawer !== 'copilot' && activeDrawer !== 'ai-copilot') return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.chat({
        message: textToSend,
        documentContext: document?.plainText || '',
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.response || res.answer || res.text || 'I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Sorry, I encountered an error answering your prompt. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: 'summary' | 'action-items' | 'faq' | 'translate') => {
    if (!document) return;
    setIsLoading(true);

    let promptDescription = '';
    if (action === 'summary') promptDescription = 'Summarize this document into key highlights:';
    if (action === 'action-items') promptDescription = 'Extract all action items, owners, and deliverables from this document:';
    if (action === 'faq') promptDescription = 'Generate a 3-question FAQ based on the content of this document:';
    if (action === 'translate') promptDescription = 'Translate this document summary into Spanish:';

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptDescription,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let resultText = '';
      if (action === 'summary') {
        const res = await aiApi.summarize(document.plainText, 'bullet-points');
        resultText = res.summary;
      } else if (action === 'translate') {
        const res = await aiApi.translate(document.plainText.substring(0, 500), 'Spanish');
        resultText = res.translatedText;
      } else {
        const res = await aiApi.chat({
          message: promptDescription,
          documentContext: document.plainText,
        });
        resultText = res.answer || res.text || res.response || '';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: resultText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-4rem)] z-30 animate-fade-in shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-brand-500/10 to-purple-500/10 dark:from-brand-950/40 dark:to-purple-950/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">AI Copilot</h3>
            <p className="text-[10px] text-slate-400">Context-Aware Assistant</p>
          </div>
        </div>

        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex flex-wrap gap-1.5">
        <button
          onClick={() => handleQuickAction('summary')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-[11px] font-medium transition-all"
        >
          <FileText className="w-3 h-3 text-brand-500" /> Summary
        </button>
        <button
          onClick={() => handleQuickAction('action-items')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-[11px] font-medium transition-all"
        >
          <ListOrdered className="w-3 h-3 text-purple-500" /> Tasks
        </button>
        <button
          onClick={() => handleQuickAction('faq')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-[11px] font-medium transition-all"
        >
          <HelpCircle className="w-3 h-3 text-emerald-500" /> FAQ
        </button>
        <button
          onClick={() => handleQuickAction('translate')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-[11px] font-medium transition-all"
        >
          <Globe className="w-3 h-3 text-amber-500" /> Spanish
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {msg.sender === 'assistant' ? (
                <Bot className="w-3 h-3 text-brand-500" />
              ) : (
                <User className="w-3 h-3 text-slate-400" />
              )}
              <span className="text-[10px] text-slate-400 font-medium">
                {msg.sender === 'assistant' ? 'Copilot' : 'You'} • {msg.timestamp}
              </span>
            </div>

            <div
              className={`rounded-2xl p-3 text-xs leading-relaxed max-w-[90%] shadow-xs whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200 dark:border-slate-700'
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === 'assistant' && msg.id !== 'welcome' && (
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <button
                  onClick={() => navigator.clipboard.writeText(msg.text)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-brand-500 font-medium"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  onClick={() => applyAIText(msg.text, 'append')}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-brand-500 font-medium"
                >
                  <ArrowDownToLine className="w-3 h-3" /> Insert into doc
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-brand-500 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>AI is analyzing and drafting...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-500">
          <input
            type="text"
            placeholder="Ask AI or instruct edits..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none text-xs focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
