import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DocumentItem, UserPresence, CommentItem, ChatMessage, DocumentVersion } from '../types';
import { documentApi, commentApi, versionApi } from '../services/api';
import {
  getSocket,
  joinDocumentRoom,
  broadcastChanges,
  broadcastChat,
  broadcastResolveComment,
  broadcastCursor,
} from '../services/socket';
import { useAuth } from './AuthContext';

export type DrawerType = 'none' | 'copilot' | 'comments' | 'chat' | 'versions' | 'outline' | 'ai-copilot' | null;
export type ModalType = 'none' | 'share' | 'templates' | 'template' | 'settings' | 'ai-prompt' | 'analytics' | 'history' | null;

export interface DocumentContextType {
  document: DocumentItem | null;
  isLoading: boolean;
  isLoadingDoc: boolean;
  activeUsers: UserPresence[];
  collaborators: UserPresence[];
  typingUsers: string[];
  comments: CommentItem[];
  chatMessages: ChatMessage[];
  versions: DocumentVersion[];
  saveStatus: 'saved' | 'saving' | 'offline' | 'error';
  lastSaved: Date | null;
  activeDrawer: DrawerType;
  activeModal: ModalType;
  selectedTextForAI: string;
  aiSelectionPosition: { top: number; left: number } | null;
  loadDocument: (id: string) => Promise<void>;
  updateDocumentTitle: (title: string) => Promise<void>;
  updateDocumentMetadata: (data: Partial<DocumentItem>) => Promise<void>;
  handleContentChange: (content: string, plainText: string) => void;
  sendDocumentUpdate: (content: string, plainText: string) => void;
  sendCursorMove: (cursor: { from: number; to: number } | null) => void;
  addComment: (text: string, selectedText?: string, parentId?: string) => Promise<void>;
  resolveComment: (commentId: string, resolved?: boolean) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addReplyToComment: (commentId: string, text: string) => Promise<void>;
  sendChat: (text: string) => void;
  sendChatMessage: (text: string) => void;
  createSnapshot: (description?: string) => Promise<void>;
  restoreSnapshot: (versionId: string) => Promise<void>;
  setActiveDrawer: (drawer: DrawerType) => void;
  setActiveModal: (modal: ModalType) => void;
  setAISelection: (text: string, pos: { top: number; left: number } | null) => void;
  applyAIText: (text: string, mode?: 'replace' | 'append' | 'insert') => void;
  editorInstance: any;
  setEditorInstance: (editor: any) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode; documentId?: string }> = ({
  children,
  documentId,
}) => {
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(documentId));
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>('none');
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedTextForAI, setSelectedTextForAI] = useState<string>('');
  const [aiSelectionPosition, setAiSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const loadDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const doc = await documentApi.getById(id);
      setDocument(doc);
      setSaveStatus('saved');

      const [docComments, docVersions] = await Promise.all([
        commentApi.getComments(id).catch(() => []),
        versionApi.getVersions(id).catch(() => []),
      ]);
      setComments(docComments);
      setVersions(docVersions);

      joinDocumentRoom(id, user);
    } catch (err) {
      console.error('Failed to load document:', err);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (documentId) {
      setIsLoading(true);
      loadDocument(documentId);
    } else {
      setDocument(null);
      setIsLoading(false);
    }
  }, [documentId, loadDocument]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('active-users', (users: UserPresence[]) => {
      setActiveUsers(users);
    });

    socket.on('user-joined', ({ activeUsers: allUsers }: { user: UserPresence; activeUsers: UserPresence[] }) => {
      setActiveUsers(allUsers || []);
    });

    socket.on('user-left', ({ activeUsers: allUsers }: { activeUsers: UserPresence[] }) => {
      setActiveUsers(allUsers || []);
    });

    socket.on('peer-typing', ({ userName, isTyping }: { userName: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName];
        }
        return prev.filter((u) => u !== userName);
      });
    });

    socket.on('receive-changes', ({ content, plainText }: { content: string; plainText?: string }) => {
      setDocument((prev) => (prev ? { ...prev, content, plainText: plainText || prev.plainText } : null));
      if (editorInstance && editorInstance.getHTML() !== content) {
        editorInstance.commands.setContent(content, false);
      }
    });

    socket.on('document-saved', () => {
      setSaveStatus('saved');
      setLastSaved(new Date());
    });

    socket.on('receive-comment', ({ comment }: { comment: CommentItem }) => {
      setComments((prev) => [comment, ...prev]);
    });

    socket.on('comment-resolved', ({ commentId }: { commentId: string }) => {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c))
      );
    });

    socket.on('receive-chat', ({ message }: { message: ChatMessage }) => {
      setChatMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('active-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('peer-typing');
      socket.off('receive-changes');
      socket.off('document-saved');
      socket.off('receive-comment');
      socket.off('comment-resolved');
      socket.off('receive-chat');
    };
  }, [editorInstance]);

  const updateDocumentTitle = async (title: string) => {
    if (!document) return;
    setDocument((prev) => (prev ? { ...prev, title } : null));
    try {
      await documentApi.update(document.id, { title });
    } catch (e) {
      console.error(e);
    }
  };

  const updateDocumentMetadata = async (data: Partial<DocumentItem>) => {
    if (!document) return;
    setDocument((prev) => (prev ? { ...prev, ...data } : null));
    try {
      await documentApi.update(document.id, data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentChange = (content: string, plainText: string) => {
    if (!document) return;
    setSaveStatus('saving');
    setDocument((prev) => (prev ? { ...prev, content, plainText } : null));
    broadcastChanges(document.id, content, plainText);

    // Debounced persistence ensures offline edits or socket hiccups are persisted
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await documentApi.update(document.id, { content, plainText });
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (e) {
        console.error('Auto-save error:', e);
        setSaveStatus('error');
      }
    }, 800);
  };

  const sendCursorMove = (cursor: { from: number; to: number } | null) => {
    if (!document) return;
    broadcastCursor(document.id, cursor);
  };

  const addComment = async (text: string, selectedText?: string, parentId?: string) => {
    if (!document) return;
    if (parentId) {
      await addReplyToComment(parentId, text);
      return;
    }
    try {
      const newComment = await commentApi.createComment(document.id, {
        authorName: user.name,
        authorAvatar: user.avatar,
        authorColor: user.color,
        text,
        selectedText,
      });
      setComments((prev) => [newComment, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean = true) => {
    try {
      await commentApi.updateComment(commentId, { resolved });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved } : c))
      );
      if (document && resolved) {
        broadcastResolveComment(document.id, commentId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error(e);
    }
  };

  const addReplyToComment = async (commentId: string, text: string) => {
    try {
      const reply = await commentApi.addReply(commentId, {
        authorName: user.name,
        authorAvatar: user.avatar,
        authorColor: user.color,
        text,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const sendChat = (text: string) => {
    if (!document || !text.trim()) return;
    const optimisticMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      documentId: document.id,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMessage]);
    broadcastChat(document.id, text.trim());
  };

  const createSnapshot = async (description?: string) => {
    if (!document) return;
    try {
      const snapshot = await versionApi.createSnapshot(document.id, description, user.name);
      setVersions((prev) => [snapshot, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const restoreSnapshot = async (versionId: string) => {
    if (!document) return;
    try {
      const restored = await versionApi.restore(document.id, versionId);
      setDocument(restored);
      if (editorInstance) {
        editorInstance.commands.setContent(restored.content);
      }
      broadcastChanges(document.id, restored.content, restored.plainText);
      const updatedVersions = await versionApi.getVersions(document.id);
      setVersions(updatedVersions);
    } catch (e) {
      console.error(e);
    }
  };

  const setAISelection = (text: string, pos: { top: number; left: number } | null) => {
    setSelectedTextForAI(text);
    setAiSelectionPosition(pos);
  };

  const applyAIText = (text: string, mode: 'replace' | 'append' | 'insert' = 'insert') => {
    if (!editorInstance) return;
    if (mode === 'replace') {
      editorInstance.commands.insertContent(text);
    } else if (mode === 'append') {
      editorInstance.commands.focus('end');
      editorInstance.commands.insertContent(`\n${text}`);
    } else {
      editorInstance.commands.insertContent(text);
    }
    const html = editorInstance.getHTML();
    const plain = editorInstance.getText();
    handleContentChange(html, plain);
  };

  return (
    <DocumentContext.Provider
      value={{
        document,
        isLoading,
        isLoadingDoc: isLoading,
        activeUsers,
        collaborators: activeUsers,
        typingUsers,
        comments,
        chatMessages,
        versions,
        saveStatus,
        lastSaved,
        activeDrawer,
        activeModal,
        selectedTextForAI,
        aiSelectionPosition,
        loadDocument,
        updateDocumentTitle,
        updateDocumentMetadata,
        handleContentChange,
        sendDocumentUpdate: handleContentChange,
        sendCursorMove,
        addComment,
        resolveComment,
        deleteComment,
        addReplyToComment,
        sendChat,
        sendChatMessage: sendChat,
        createSnapshot,
        restoreSnapshot,
        setActiveDrawer,
        setActiveModal,
        setAISelection,
        applyAIText,
        editorInstance,
        setEditorInstance,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};
