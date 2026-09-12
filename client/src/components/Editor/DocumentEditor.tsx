import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { useDocument } from '../../context/DocumentContext';
import { useAuth } from '../../context/AuthContext';
import { EditorToolbar } from './EditorToolbar';
import { InlineAIPopover } from './InlineAIPopover';
import { InlineCommandBar } from './InlineCommandBar';
import { Sparkles, Smile, Tag, ShieldCheck, RefreshCw } from 'lucide-react';

export const DocumentEditor: React.FC = () => {
  const {
    document,
    collaborators,
    saveStatus,
    updateDocumentMetadata,
    sendDocumentUpdate,
    sendCursorMove,
    setEditorInstance,
    setAISelection,
    setActiveModal,
  } = useDocument();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const isLocalUpdateRef = useRef(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      try {
        setTags(Array.isArray(document.tags) ? document.tags : JSON.parse(document.tags || '[]'));
      } catch {
        setTags(['general']);
      }
    }
  }, [document?.id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Write your ideas here or press Ctrl+K for AI...',
      }),
    ],
    content: document?.content || '',
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] text-slate-800 dark:text-slate-100 selection:bg-brand-500/20 px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      if (isLocalUpdateRef.current) return;
      const html = editor.getHTML();
      const plain = editor.getText();
      sendDocumentUpdate(html, plain);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      sendCursorMove({ from, to });

      const text = editor.state.doc.textBetween(from, to, ' ');
      if (text.trim().length > 2) {
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const rect = domSelection.getRangeAt(0).getBoundingClientRect();
          setAISelection(text, { top: rect.top, left: rect.left });
        }
      } else {
        setAISelection('', null);
      }
    },
  });

  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
  }, [editor, setEditorInstance]);

  // Update editor content when remote changes arrive
  useEffect(() => {
    if (!editor || !document) return;
    const currentHtml = editor.getHTML();
    if (document.content !== currentHtml) {
      isLocalUpdateRef.current = true;
      editor.commands.setContent(document.content, false);
      isLocalUpdateRef.current = false;
    }
  }, [document?.content, editor]);

  // Global Ctrl+K shortcut for AI command modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveModal('ai-prompt');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveModal]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== document?.title) {
      updateDocumentMetadata({ title: title.trim() });
    }
  };

  const commonEmojis = ['📝', '🚀', '💡', '📊', '⚡', '🎯', '✨', '🔥', '📚', '🛠️', '💼', '📌'];

  const handleEmojiSelect = (emoji: string) => {
    setShowEmojiPicker(false);
    updateDocumentMetadata({ icon: emoji });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim().toLowerCase())) {
      const updated = [...tags, newTagInput.trim().toLowerCase()];
      setTags(updated);
      setNewTagInput('');
      setShowTagInput(false);
      updateDocumentMetadata({ tags: updated });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    updateDocumentMetadata({ tags: updated });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/50 dark:bg-slate-950 overflow-y-auto">
      <EditorToolbar editor={editor} />
      <InlineAIPopover />
      <InlineCommandBar />

      <div className="max-w-4xl w-full mx-auto my-8 px-4 flex-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl min-h-[750px] overflow-hidden flex flex-col relative transition-all">
          {/* Header Metadata Section */}
          <div className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-4xl p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
                  title="Change Document Icon"
                >
                  {document?.icon || '📝'}
                </button>

                {showEmojiPicker && (
                  <div className="absolute left-0 top-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-3 grid grid-cols-4 gap-2 z-30">
                    {commonEmojis.map((e) => (
                      <button
                        key={e}
                        onClick={() => handleEmojiSelect(e)}
                        className="text-2xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-transform hover:scale-125"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  placeholder="Untitled Document"
                  className="w-full text-2xl sm:text-3xl font-extrabold bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-300 dark:placeholder-slate-700"
                />

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {showTagInput ? (
                    <form onSubmit={handleAddTag} className="inline-flex items-center">
                      <input
                        type="text"
                        placeholder="Tag name..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        autoFocus
                        className="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-500 w-24"
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 font-medium px-1.5 py-0.5"
                    >
                      <Tag className="w-3 h-3" /> + Add tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TipTap Document Area */}
          <div className="flex-1 relative">
            <EditorContent editor={editor} />
          </div>

          {/* Status footer inside document card */}
          <div className="px-8 py-3 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>{editor?.storage.characterCount.words() || 0} words</span>
              <span>{editor?.storage.characterCount.characters() || 0} characters</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="capitalize flex items-center gap-1">
                {saveStatus === 'saved' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    All changes synced
                  </>
                ) : saveStatus === 'saving' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Unsaved changes'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
