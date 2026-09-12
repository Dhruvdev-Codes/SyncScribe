export interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    from: number;
    to: number;
  } | null;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor: string;
  text: string;
  timestamp: string;
}

export interface AICompletionRequest {
  prompt: string;
  context?: string;
  stream?: boolean;
  model?: string;
}

export interface AIRewriteRequest {
  text: string;
  instruction?: string;
  tone?: 'formal' | 'casual' | 'concise' | 'creative' | 'professional';
  mode?: 'rewrite' | 'shorten' | 'expand' | 'fix-grammar' | 'simplify';
  context?: string;
}

export interface AIChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  documentContext?: string;
}

export interface AISummarizeRequest {
  text: string;
  format?: 'paragraph' | 'bullet-points' | 'executive';
}

export interface AITranslateRequest {
  text: string;
  targetLanguage: string;
}
