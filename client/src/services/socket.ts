import { io, Socket } from 'socket.io-client';
import { User, UserPresence, ChatMessage } from '../types';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // VITE_API_URL lets us point at a remote backend (e.g. Render) from GitHub Pages.
    const envUrl = import.meta.env.VITE_API_URL;
    let URL: string;
    if (envUrl) {
      URL = envUrl; // explicit backend URL
    } else if (window.location.hostname === 'localhost') {
      URL = 'http://localhost:5000';
    } else {
      URL = '/'; // same-origin (works when server + client are co-hosted)
    }
    socket = io(URL, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const joinDocumentRoom = (documentId: string, user: User) => {
  const s = getSocket();
  s.emit('join-document', { documentId, user });
};

export const broadcastChanges = (documentId: string, content: string, plainText?: string, delta?: any, version?: number) => {
  const s = getSocket();
  s.emit('send-changes', { documentId, content, plainText, delta, version });
};

export const broadcastCursor = (documentId: string, cursor: { from: number; to: number } | null) => {
  const s = getSocket();
  s.emit('cursor-move', { documentId, cursor });
};

export const broadcastTyping = (documentId: string, isTyping: boolean) => {
  const s = getSocket();
  s.emit('user-typing', { documentId, isTyping });
};

export const broadcastComment = (documentId: string, comment: any) => {
  const s = getSocket();
  s.emit('send-comment', { documentId, comment });
};

export const broadcastResolveComment = (documentId: string, commentId: string) => {
  const s = getSocket();
  s.emit('resolve-comment', { documentId, commentId });
};

export const broadcastChat = (documentId: string, text: string) => {
  const s = getSocket();
  s.emit('send-chat', { documentId, message: { text } });
};
