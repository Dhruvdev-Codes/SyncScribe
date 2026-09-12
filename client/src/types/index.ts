export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    from: number;
    to: number;
  } | null;
  lastActive?: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  plainText: string;
  summary?: string;
  coverImage?: string;
  icon?: string;
  isPublic: boolean;
  ownerId?: string;
  tags: string | string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    versions: number;
  };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  content: string;
  plainText: string;
  description?: string;
  changeSummary?: string;
  authorName: string;
  createdAt: string;
}

export interface CommentReply {
  id: string;
  commentId: string;
  authorName: string;
  authorAvatar?: string;
  authorColor: string;
  text: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  documentId: string;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  authorColor: string;
  text: string;
  selectedText?: string;
  rangeStart?: number;
  rangeEnd?: number;
  resolved: boolean;
  isResolved?: boolean;
  createdAt: string;
  updatedAt: string;
  replies: CommentReply[];
}

export interface ChatMessage {
  id: string;
  documentId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  senderColor?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userColor?: string;
  text: string;
  timestamp: string;
}

export interface DocumentTemplate {
  id: string;
  name?: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  content: string;
}

export type TemplateItem = DocumentTemplate;
export type DrawerType = 'copilot' | 'comments' | 'chat' | 'versions' | 'outline' | 'ai-copilot' | 'none' | null;

