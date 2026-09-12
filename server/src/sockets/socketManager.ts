import { Server, Socket } from 'socket.io';
import prisma from '../db';
import { UserPresence, ChatMessage } from '../types';
import { logActivity } from '../services/activityLogger';


// In-memory room state tracking
interface RoomState {
  users: Map<string, UserPresence>;
  lastSavedContent: string;
  saveTimeout: NodeJS.Timeout | null;
}

const rooms = new Map<string, RoomState>();

export const initSocketManager = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    let currentDocumentId: string | null = null;
    let currentUser: UserPresence | null = null;

    socket.on('join-document', async ({ documentId, user }: { documentId: string; user: { id: string; name: string; avatar?: string; color?: string } }) => {
      currentDocumentId = documentId;
      const userPresence: UserPresence = {
        id: user.id || socket.id,
        name: user.name || 'Anonymous Writer',
        avatar: user.avatar,
        color: user.color || '#3b82f6',
        cursor: null,
        lastActive: Date.now(),
      };
      currentUser = userPresence;

      socket.join(`doc:${documentId}`);

      if (!rooms.has(documentId)) {
        rooms.set(documentId, {
          users: new Map(),
          lastSavedContent: '',
          saveTimeout: null,
        });
      }

      const room = rooms.get(documentId)!;
      room.users.set(socket.id, userPresence);

      const activeUsersList = Array.from(room.users.values());

      // Send initial list to newly joined user
      socket.emit('active-users', activeUsersList);

      // Broadcast to other peers in room
      socket.to(`doc:${documentId}`).emit('user-joined', {
        user: userPresence,
        activeUsers: activeUsersList,
      });

      console.log(`[Socket] User ${userPresence.name} (${socket.id}) joined room doc:${documentId}`);
      logActivity({
        action: 'COLLABORATOR_JOINED',
        entityType: 'user',
        entityId: userPresence.id,
        details: `${userPresence.name} joined document ${documentId}`,
        userName: userPresence.name,
        metadata: { documentId, socketId: socket.id },
      });

    });

    socket.on('send-changes', async ({ documentId, content, plainText, delta, version }: { documentId: string; content: string; plainText?: string; delta?: any; version?: number }) => {
      // Broadcast real-time delta to all other connected peers
      socket.to(`doc:${documentId}`).emit('receive-changes', {
        content,
        delta,
        version,
        senderId: socket.id,
        senderName: currentUser?.name,
      });

      // Debounced database autosave
      const room = rooms.get(documentId);
      if (room) {
        room.lastSavedContent = content;
        if (room.saveTimeout) {
          clearTimeout(room.saveTimeout);
        }

        room.saveTimeout = setTimeout(async () => {
          try {
            await prisma.document.update({
              where: { id: documentId },
              data: {
                content,
                plainText: plainText || '',
                updatedAt: new Date(),
              },
            });
            io.to(`doc:${documentId}`).emit('document-saved', { timestamp: new Date().toISOString() });
          } catch (err) {
            console.error(`Failed to auto-save document ${documentId}:`, err);
          }
        }, 1200);
      }
    });

    socket.on('cursor-move', ({ documentId, cursor }: { documentId: string; cursor: { from: number; to: number } | null }) => {
      if (currentUser) {
        currentUser.cursor = cursor;
        currentUser.lastActive = Date.now();
      }
      socket.to(`doc:${documentId}`).emit('cursor-update', {
        userId: currentUser?.id || socket.id,
        socketId: socket.id,
        cursor,
        user: currentUser,
      });
    });

    socket.on('user-typing', ({ documentId, isTyping }: { documentId: string; isTyping: boolean }) => {
      socket.to(`doc:${documentId}`).emit('peer-typing', {
        userId: currentUser?.id || socket.id,
        userName: currentUser?.name || 'Collaborator',
        isTyping,
      });
    });

    socket.on('send-comment', ({ documentId, comment }: { documentId: string; comment: any }) => {
      socket.to(`doc:${documentId}`).emit('receive-comment', { comment });
    });

    socket.on('resolve-comment', ({ documentId, commentId }: { documentId: string; commentId: string }) => {
      socket.to(`doc:${documentId}`).emit('comment-resolved', { commentId });
    });

    socket.on('send-chat', ({ documentId, message }: { documentId: string; message: { text: string } }) => {
      const chatMsg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        documentId,
        senderId: currentUser?.id || socket.id,
        senderName: currentUser?.name || 'Anonymous',
        senderAvatar: currentUser?.avatar,
        senderColor: currentUser?.color || '#3b82f6',
        text: message.text,
        timestamp: new Date().toISOString(),
      };

      logActivity({
        action: 'CHAT_MESSAGE_SENT',
        entityType: 'chat',
        entityId: chatMsg.id,
        details: `Chat from ${chatMsg.senderName}: "${chatMsg.text.slice(0, 50)}"`,
        userName: chatMsg.senderName,
        metadata: { documentId },
      });

      io.to(`doc:${documentId}`).emit('receive-chat', { message: chatMsg });
    });

    socket.on('disconnect', () => {
      if (currentDocumentId && rooms.has(currentDocumentId)) {
        const room = rooms.get(currentDocumentId)!;
        room.users.delete(socket.id);
        const remainingUsers = Array.from(room.users.values());

        socket.to(`doc:${currentDocumentId}`).emit('user-left', {
          userId: currentUser?.id || socket.id,
          socketId: socket.id,
          user: currentUser,
          activeUsers: remainingUsers,
        });

        if (room.users.size === 0) {
          if (room.saveTimeout) {
            clearTimeout(room.saveTimeout);
          }
          rooms.delete(currentDocumentId);
        }
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
