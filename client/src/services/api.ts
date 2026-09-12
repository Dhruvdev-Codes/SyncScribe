import axios from 'axios';
import { DocumentItem, DocumentVersion, CommentItem, DocumentTemplate } from '../types';

// VITE_API_URL lets us point the client at a separate backend (e.g. Render)
// when deployed to GitHub Pages. Falls back to same-origin '/api'.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents API
export const documentApi = {
  getAll: async (search?: string, tag?: string): Promise<DocumentItem[]> => {
    const params: any = {};
    if (search) params.search = search;
    if (tag) params.tag = tag;
    const res = await api.get('/documents', { params });
    return res.data;
  },

  getById: async (id: string): Promise<DocumentItem> => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },

  create: async (data: Partial<DocumentItem> & { templateId?: string }): Promise<DocumentItem> => {
    const res = await api.post('/documents', data);
    return res.data;
  },

  update: async (id: string, data: Partial<DocumentItem>): Promise<DocumentItem> => {
    const res = await api.put(`/documents/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  duplicate: async (id: string): Promise<DocumentItem> => {
    const res = await api.post(`/documents/${id}/duplicate`);
    return res.data;
  },

  getExportUrl: (id: string, format: 'markdown' | 'html' | 'txt' = 'markdown'): string => {
    return `/api/documents/${id}/export?format=${format}`;
  },
};

// Versions API
export const versionApi = {
  getVersions: async (documentId: string): Promise<DocumentVersion[]> => {
    const res = await api.get(`/documents/${documentId}/versions`);
    return res.data;
  },

  createSnapshot: async (documentId: string, description?: string, authorName?: string): Promise<DocumentVersion> => {
    const res = await api.post(`/documents/${documentId}/versions`, { description, authorName });
    return res.data;
  },

  restore: async (documentId: string, versionId: string): Promise<DocumentItem> => {
    const res = await api.post(`/documents/${documentId}/versions/${versionId}/restore`);
    return res.data;
  },
};

// Comments API
export const commentApi = {
  getComments: async (documentId: string): Promise<CommentItem[]> => {
    const res = await api.get(`/documents/${documentId}/comments`);
    return res.data;
  },

  createComment: async (documentId: string, data: {
    authorName: string;
    authorAvatar?: string;
    authorColor?: string;
    text: string;
    selectedText?: string;
    rangeStart?: number;
    rangeEnd?: number;
  }): Promise<CommentItem> => {
    const res = await api.post(`/documents/${documentId}/comments`, data);
    return res.data;
  },

  updateComment: async (commentId: string, data: { text?: string; resolved?: boolean }): Promise<CommentItem> => {
    const res = await api.put(`/comments/${commentId}`, data);
    return res.data;
  },

  addReply: async (commentId: string, data: {
    authorName: string;
    authorAvatar?: string;
    authorColor?: string;
    text: string;
  }) => {
    const res = await api.post(`/comments/${commentId}/replies`, data);
    return res.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};

// Templates API
export const templateApi = {
  getAll: async (): Promise<DocumentTemplate[]> => {
    const res = await api.get('/templates');
    return res.data;
  },

  getById: async (id: string): Promise<DocumentTemplate> => {
    const res = await api.get(`/templates/${id}`);
    return res.data;
  },
};

// AI API
export const aiApi = {
  generate: async (
    promptOrData: string | { prompt: string; context?: string; mode?: string },
    context?: string
  ): Promise<{ text: string }> => {
    const payload = typeof promptOrData === 'string'
      ? { prompt: promptOrData, context }
      : promptOrData;
    const res = await api.post('/ai/generate', payload);
    return res.data;
  },

  rewrite: async (data: {
    text: string;
    instruction?: string;
    tone?: string;
    mode?: string;
    context?: string;
  }): Promise<{ text: string }> => {
    const res = await api.post('/ai/rewrite', data);
    return res.data;
  },

  chat: async (
    messagesOrObj: Array<{ role: string; content: string }> | { message: string; documentContext?: string },
    documentContext?: string
  ): Promise<{ response: string; answer?: string; text?: string }> => {
    let payload: any;
    if (Array.isArray(messagesOrObj)) {
      payload = { messages: messagesOrObj, documentContext };
    } else {
      payload = {
        messages: [{ role: 'user', content: messagesOrObj.message }],
        documentContext: messagesOrObj.documentContext,
      };
    }
    const res = await api.post('/ai/chat', payload);
    const data = res.data;
    const responseText = data.response || data.answer || data.text || '';
    return { response: responseText, answer: responseText, text: responseText };
  },

  summarize: async (text: string, format?: string): Promise<{ summary: string }> => {
    const res = await api.post('/ai/summarize', { text, format });
    return res.data;
  },

  extractActionItems: async (text: string): Promise<{ actionItems: any }> => {
    const res = await api.post('/ai/actions', { text });
    return res.data;
  },

  generateFaq: async (text: string): Promise<{ faq: any }> => {
    const res = await api.post('/ai/faq', { text });
    return res.data;
  },

  translate: async (text: string, targetLanguage: string): Promise<{ translatedText: string; targetLanguage: string }> => {
    const res = await api.post('/ai/translate', { text, targetLanguage });
    return res.data;
  },
};
