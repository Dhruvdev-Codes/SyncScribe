import { io, Socket } from 'socket.io-client';
import { User, UserPresence, ChatMessage } from '../types';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
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
