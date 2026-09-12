import axios from 'axios';
import {
  DocumentItem,
  DocumentVersion,
  CommentItem,
  CommentReply,
  DocumentTemplate,
} from '../types';
import {
  localDocumentApi,
  localVersionApi,
  localCommentApi,
  localTemplateApi,
  localAiApi,
  seedIfNeeded,
} from './localApi';

// ---------------------------------------------------------------------------
// API mode detection
// ---------------------------------------------------------------------------
// SyncScribe auto-probes the backend and gracefully falls back to a localStorage-backed
// data layer if the backend is offline or when running in a standalone static deployment.
// ---------------------------------------------------------------------------

// VITE_API_URL lets us point the client at a separate backend (e.g. Render)
// when deployed separately from the backend. Falls back to same-origin '/api'.
const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
    : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

const forceLocal =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_LOCAL_STORAGE === 'true';

let localMode: boolean | null = forceLocal ? true : null;
let modePromise: Promise<boolean> | null = null;

/** Synchronous check — only guaranteed after `modeReady()` resolved. */
export const isLocalMode = (): boolean => localMode === true;

/**
 * Resolves (and caches) which data layer to use.
 * Returns true when the offline/local layer is active.
 */
export const modeReady = (): Promise<boolean> => {
  if (localMode !== null) return Promise.resolve(localMode);
  if (!modePromise) {
    modePromise = (async () => {
      try {
        // Fast probe: can we talk to the backend at all?
        await api.get('/documents', { timeout: 3000 });
        localMode = false;
        console.log('[SyncScribe] Connected to live cloud backend API.');
      } catch {
        localMode = true;
        seedIfNeeded();
        console.warn(
          '[SyncScribe] Backend not reachable — running in offline demo mode with local storage.'
        );
      }
      return localMode;
    })();
  }
  return modePromise;
};

/** Dispatches to the remote API when available, otherwise falls back to local mode. */
async function route<T>(
  remoteCall: () => Promise<T>,
  localCall: () => Promise<T>
): Promise<T> {
  if (await modeReady()) return localCall();
  try {
    return await remoteCall();
  } catch (err) {
    localMode = true;
    seedIfNeeded();
    console.warn('[SyncScribe] Backend call failed — switching to offline demo mode.', err);
    return localCall();
  }
}

// Documents API
export const documentApi = {
  getAll: async (search?: string, tag?: string): Promise<DocumentItem[]> => {
    const params: any = {};
    if (search) params.search = search;
    if (tag) params.tag = tag;
    return route(
      async () => (await api.get('/documents', { params })).data,
      () => localDocumentApi.getAll(search, tag),
    );
  },

  getById: async (id: string): Promise<DocumentItem> => {
    return route(
      async () => (await api.get(`/documents/${id}`)).data,
      () => localDocumentApi.getById(id),
    );
  },

  create: async (data: Partial<DocumentItem> & { templateId?: string }): Promise<DocumentItem> => {
    return route(
      async () => (await api.post('/documents', data)).data,
      () => localDocumentApi.create(data),
    );
  },

  update: async (id: string, data: Partial<DocumentItem>): Promise<DocumentItem> => {
    return route(
      async () => (await api.put(`/documents/${id}`, data)).data,
      () => localDocumentApi.update(id, data),
    );
  },

  delete: async (id: string): Promise<void> => {
    return route(
      async () => { await api.delete(`/documents/${id}`); },
      () => localDocumentApi.delete(id),
    );
  },

  duplicate: async (id: string): Promise<DocumentItem> => {
    return route(
      async () => (await api.post(`/documents/${id}/duplicate`)).data,
      () => localDocumentApi.duplicate(id),
    );
  },

  getExportUrl: (id: string, format: 'markdown' | 'html' | 'txt' = 'markdown'): string => {
    if (isLocalMode()) return localDocumentApi.getExportUrl(id, format);
    return `/api/documents/${id}/export?format=${format}`;
  },
};

// Versions API
export const versionApi = {
  getVersions: async (documentId: string): Promise<DocumentVersion[]> => {
    return route(
      async () => (await api.get(`/documents/${documentId}/versions`)).data,
      () => localVersionApi.getVersions(documentId),
    );
  },

  createSnapshot: async (
    documentId: string,
    description?: string,
    authorName?: string
  ): Promise<DocumentVersion> => {
    return route(
      async () =>
        (await api.post(`/documents/${documentId}/versions`, { description, authorName })).data,
      () => localVersionApi.createSnapshot(documentId, description, authorName),
    );
  },

  restore: async (documentId: string, versionId: string): Promise<DocumentItem> => {
    return route(
      async () =>
        (await api.post(`/documents/${documentId}/versions/${versionId}/restore`)).data,
      () => localVersionApi.restore(documentId, versionId),
    );
  },
};

// Comments API
export const commentApi = {
  getComments: async (documentId: string): Promise<CommentItem[]> => {
    return route(
      async () => (await api.get(`/documents/${documentId}/comments`)).data,
      () => localCommentApi.getComments(documentId),
    );
  },

  createComment: async (
    documentId: string,
    data: {
      authorName: string;
      authorAvatar?: string;
      authorColor?: string;
      text: string;
      selectedText?: string;
      rangeStart?: number;
      rangeEnd?: number;
    }
  ): Promise<CommentItem> => {
    return route(
      async () => (await api.post(`/documents/${documentId}/comments`, data)).data,
      () => localCommentApi.createComment(documentId, data),
    );
  },

  updateComment: async (
    commentId: string,
    data: { text?: string; resolved?: boolean }
  ): Promise<CommentItem> => {
    return route(
      async () => (await api.put(`/comments/${commentId}`, data)).data,
      () => localCommentApi.updateComment(commentId, data),
    );
  },

  addReply: async (
    commentId: string,
    data: {
      authorName: string;
      authorAvatar?: string;
      authorColor?: string;
      text: string;
    }
  ): Promise<CommentReply> => {
    return route(
      async () => (await api.post(`/comments/${commentId}/replies`, data)).data,
      () => localCommentApi.addReply(commentId, data),
    );
  },

  deleteComment: async (commentId: string): Promise<void> => {
    return route(
      async () => { await api.delete(`/comments/${commentId}`); },
      () => localCommentApi.deleteComment(commentId),
    );
  },
};

// Templates API
export const templateApi = {
  getAll: async (): Promise<DocumentTemplate[]> => {
    return route(
      async () => (await api.get('/templates')).data,
      () => localTemplateApi.getAll(),
    );
  },

  getById: async (id: string): Promise<DocumentTemplate> => {
    return route(
      async () => (await api.get(`/templates/${id}`)).data,
      () => localTemplateApi.getById(id),
    );
  },
};

// AI API (offline demo engine when no backend is available)
export const aiApi = {
  generate: async (
    promptOrData: string | { prompt: string; context?: string; mode?: string },
    context?: string
  ): Promise<{ text: string }> => {
    return route(
      async () => {
        const payload =
          typeof promptOrData === 'string' ? { prompt: promptOrData, context } : promptOrData;
        return (await api.post('/ai/generate', payload)).data;
      },
      () => localAiApi.generate(promptOrData, context),
    );
  },

  rewrite: async (data: {
    text: string;
    instruction?: string;
    tone?: string;
    mode?: string;
    context?: string;
  }): Promise<{ text: string }> => {
    return route(
      async () => (await api.post('/ai/rewrite', data)).data,
      () => localAiApi.rewrite(data),
    );
  },

  chat: async (
    messagesOrObj:
      | Array<{ role: string; content: string }>
      | { message: string; documentContext?: string },
    documentContext?: string
  ): Promise<{ response: string; answer?: string; text?: string }> => {
    return route<{ response: string; answer?: string; text?: string }>(
      async () => {
        const payload: any = Array.isArray(messagesOrObj)
          ? { messages: messagesOrObj, documentContext }
          : { messages: [{ role: 'user', content: messagesOrObj.message }], documentContext: messagesOrObj.documentContext };
        const res = await api.post('/ai/chat', payload);
        const data = res.data;
        const responseText = data.response || data.answer || data.text || '';
        return { response: responseText, answer: responseText, text: responseText };
      },
      () => localAiApi.chat(messagesOrObj, documentContext),
    );
  },

  summarize: async (text: string, format?: string): Promise<{ summary: string }> => {
    return route(
      async () => (await api.post('/ai/summarize', { text, format })).data,
      () => localAiApi.summarize(text, format),
    );
  },

  extractActionItems: async (text: string): Promise<{ actionItems: any }> => {
    return route(
      async () => (await api.post('/ai/actions', { text })).data,
      () => localAiApi.extractActionItems(text),
    );
  },

  generateFaq: async (text: string): Promise<{ faq: any }> => {
    return route(
      async () => (await api.post('/ai/faq', { text })).data,
      () => localAiApi.generateFaq(text),
    );
  },

  translate: async (
    text: string,
    targetLanguage: string
  ): Promise<{ translatedText: string; targetLanguage: string }> => {
    return route(
      async () => (await api.post('/ai/translate', { text, targetLanguage })).data,
      () => localAiApi.translate(text, targetLanguage),
    );
  },
};
