/**
 * localApi.ts
 * ---------------------------------------------------------------------------
 * Offline / demo data layer for SyncScribe.
 *
 * SyncScribe is a full-stack app (Express REST + Socket.IO + Prisma), but the
 * live site is hosted on GitHub Pages which is STATIC-ONLY hosting. There is no
 * backend there, so every `/api/*` call 404s and the site appears "broken".
 *
 * This module mirrors the exact response shapes of the Node API and persists
 * everything to the browser's localStorage, so the static site is fully usable
 * out of the box: create/edit/delete documents, templates, versions/snapshots,
 * comments, chat history and a lightweight built-in AI demo engine.
 *
 * When a real backend is reachable (VITE_API_URL set), api.ts routes to the
 * real API instead and this module is never used.
 * ---------------------------------------------------------------------------
 */
import {
  DocumentItem,
  DocumentVersion,
  CommentItem,
  CommentReply,
  DocumentTemplate,
} from '../types/index';
import { executeAICompletion, executeAIRewrite, executeAITranslation, SYSTEM_PROMPT } from './aiService';

// --------------------------------------------------------------- storage
const K_DOCS = 'syncscribe_local_documents';
const K_VERSIONS = 'syncscribe_local_versions';
const K_COMMENTS = 'syncscribe_local_comments';
const K_TEMPLATES = 'syncscribe_local_templates';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[SyncScribe local] Failed to persist:', e);
  }
}

const uid = (prefix = 'id'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const nowIso = (): string => new Date().toISOString();

// --------------------------------------------------------------- documents
type LocalDocument = DocumentItem & { _count?: { comments: number; versions: number } };

function loadDocs(): LocalDocument[] {
  return read<LocalDocument[]>(K_DOCS, []);
}
function saveDocs(docs: LocalDocument[]): void {
  write(K_DOCS, docs);
}

function withCounts(doc: LocalDocument): LocalDocument {
  const comments = read<CommentItem[]>(commentKey(doc.id), []);
  const versions = read<DocumentVersion[]>(versionKey(doc.id), []);
  return {
    ...doc,
    _count: { comments: comments.length, versions: versions.length },
  };
}

function safeParseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags || '[]');
    return Array.isArray(parsed) ? parsed : ['general'];
  } catch {
    return ['general'];
  }
}

// --------------------------------------------------------------- versions
function versionKey(docId: string): string {
  return `${K_VERSIONS}_${docId}`;
}
function loadVersions(docId: string): DocumentVersion[] {
  return read<DocumentVersion[]>(versionKey(docId), []);
}
function saveVersions(docId: string, versions: DocumentVersion[]): void {
  write(versionKey(docId), versions);
}

// --------------------------------------------------------------- comments
function commentKey(docId: string): string {
  return `${K_COMMENTS}_${docId}`;
}
function loadComments(docId: string): CommentItem[] {
  return read<CommentItem[]>(commentKey(docId), []);
}
function saveComments(docId: string, comments: CommentItem[]): void {
  write(commentKey(docId), comments);
}

function allComments(): Array<[string, CommentItem[]]> {
  const out: Array<[string, CommentItem[]]> = [];
  const docs = loadDocs();
  for (const doc of docs) {
    const comments = loadComments(doc.id);
    if (comments.length > 0) out.push([doc.id, comments]);
  }
  return out;
}

// --------------------------------------------------------------- templates
export const defaultTemplates: DocumentTemplate[] = [
  {
    id: 'template-prd',
    name: 'Product Requirements Document (PRD)',
    title: 'Product Requirements Document (PRD)',
    description: 'Comprehensive spec for engineering and product features.',
    category: 'Product',
    icon: '🚀',
    content: `<h1>Product Requirements Document (PRD)</h1>
<p><strong>Status:</strong> 🟡 In Review | <strong>Author:</strong> Product Lead</p>
<hr/>
<h2>1. Executive Summary & Problem Statement</h2>
<p>Clearly state the customer problem, market context, and high-level objective of this initiative.</p>
<h2>2. Goals & Success Metrics (OKRs)</h2>
<ul>
  <li><strong>Metric 1:</strong> Increase daily active collaboration by 35%.</li>
  <li><strong>Metric 2:</strong> Sub-50ms latency for all real-time sync operations.</li>
  <li><strong>Metric 3:</strong> 99.99% uptime across distributed regions.</li>
</ul>
<h2>3. User Personas & Stories</h2>
<blockquote>"As an engineering lead, I want to edit technical specs simultaneously with my squad and get instant AI-assisted architecture reviews."</blockquote>
<h2>4. Functional Requirements</h2>
<ul>
  <li>Real-time multi-cursor awareness and presence.</li>
  <li>AI-assisted content generation and contextual tone refinement.</li>
  <li>Version history snapshots and time-travel rollbacks.</li>
</ul>`,
  },
  {
    id: 'template-meeting-notes',
    name: 'Engineering Sprint & Meeting Notes',
    title: 'Engineering Sprint & Meeting Notes',
    description: 'Structured agenda, discussion points, action items, and attendees.',
    category: 'Team',
    icon: '👥',
    content: `<h1>Engineering Sync & Meeting Notes</h1>
<p><strong>Facilitator:</strong> Tech Lead</p>
<hr/>
<h2>👥 Attendees</h2>
<ul>
  <li>Dhruv (Lead Architect)</li>
  <li>Alex (Full-Stack Engineer)</li>
  <li>Maya (Product Designer)</li>
</ul>
<h2>🎯 Agenda</h2>
<ol>
  <li>Sprint goals review and blocker triage.</li>
  <li>AI microservice streaming performance analysis.</li>
  <li>Deployment and automated CI/CD pipeline check.</li>
</ol>
<h2>✅ Action Items</h2>
<ul>
  <li>[ ] <strong>@Alex:</strong> Benchmark Socket.IO connection limits under simulated stress.</li>
  <li>[ ] <strong>@Maya:</strong> Deliver finalized dark-mode tokens for editor toolbar.</li>
</ul>`,
  },
  {
    id: 'template-technical-rfc',
    name: 'Technical Design RFC',
    title: 'Technical Design RFC',
    description: 'Architecture blueprint, trade-offs, security, and schema designs.',
    category: 'Engineering',
    icon: '⚡',
    content: `<h1>RFC: High-Throughput Real-Time Collaborative Architecture</h1>
<p><strong>Author:</strong> Team | <strong>Target Engine:</strong> SyncScribe v1.0</p>
<hr/>
<h2>1. Abstract</h2>
<p>This RFC proposes an operational transform and state-sync protocol designed for zero-latency multiplayer document editing paired with streaming AI completion.</p>
<h2>2. Proposed Architecture</h2>
<pre><code>interface SyncPayload {
  documentId: string;
  delta: any;
  version: number;
  userId: string;
}</code></pre>`,
  },
  {
    id: 'template-brainstorm',
    name: 'Brainstorming & Ideation Board',
    title: 'Brainstorming & Ideation Board',
    description: 'Freeform collaborative sandbox for new concepts and strategic ideas.',
    category: 'Ideation',
    icon: '💡',
    content: `<h1>💡 Innovation Sandbox: Next-Gen Features</h1>
<p>Collaborative brainstorming board. Add your thoughts below or highlight text to invoke AI ideation.</p>
<hr/>
<h2>🧠 Core Theme: AI-Native Collaboration</h2>
<ul>
  <li>Auto-generating executive summaries when documents surpass 1,000 words.</li>
  <li>Automated action item extraction from meeting minutes into task trackers.</li>
  <li>Multi-language live translation for globally distributed squads.</li>
</ul>`,
  },
];

// --------------------------------------------------------------- seeding
export function seedIfNeeded(): void {
  const existing = read<LocalDocument[]>(K_DOCS, []);
  if (existing.length > 0) return;

  const t0 = new Date();
  t0.setDate(t0.getDate() - 1);
  const t1 = new Date();
  t1.setDate(t1.getDate() - 3);

  const welcome = uid('doc');
  const prd = uid('doc');

  const docs: LocalDocument[] = [
    {
      id: welcome,
      title: '👋 Welcome to SyncScribe',
      content:
        '<h1>Welcome to SyncScribe</h1><p>This is a <strong>sample document</strong> running on the live GitHub Pages site. Because GitHub Pages is static hosting, SyncScribe automatically uses an <strong>offline demo engine</strong> that saves your work straight into this browser (localStorage).</p><h2>What works here</h2><ul><li><p>Create, edit, delete &amp; duplicate documents (see the dashboard).</p></li><li><p>Rename the title by clicking it above.</p></li><li><p>Version snapshots in the <em>History</em> drawer.</p></li><li><p>Inline comments and chat via the drawers.</p></li><li><p>AI Copilot — a built-in offline demo engine, no API keys required.</p></li></ul><p>Press <strong>Ctrl+K</strong> (or <strong>Cmd+K</strong>) anywhere in the editor to summon the inline AI command bar.</p>',
      plainText:
        'Welcome to SyncScribe. This is a sample document running on the live GitHub Pages site. Because GitHub Pages is static hosting, SyncScribe automatically uses an offline demo engine that saves your work straight into this browser (localStorage). What works here: create, edit, delete & duplicate documents (see the dashboard). Rename the title by clicking it above. Version snapshots in the History drawer. Inline comments and chat via the drawers. AI Copilot with a built-in offline demo engine, no API keys required. Press Ctrl+K (or Cmd+K) anywhere in the editor to summon the inline AI command bar.',
      icon: '✨',
      isPublic: true,
      tags: ['guide'],
      version: 1,
      createdAt: t0.toISOString(),
      updatedAt: t0.toISOString(),
    },
    {
      id: prd,
      title: 'Product Requirements — SyncScribe v2',
      content:
        '<h1>Product Requirements — SyncScribe v2</h1><h2>Goals</h2><ul><li><p>Ship real-time multiplayer editing with sub-100ms latency.</p></li><li><p>Launch the AI Copilot with offline fallback support.</p></li><li><p>Reach 1,000 daily active collaborators.</p></li></ul><h2>Open questions</h2><blockquote><p>Should version history be automatic or manually snapshot-based?</p></blockquote>',
      plainText:
        'Product Requirements — SyncScribe v2. Goals: ship real-time multiplayer editing with sub-100ms latency. Launch the AI Copilot with offline fallback support. Reach 1,000 daily active collaborators. Open questions: should version history be automatic or manually snapshot-based?',
      icon: '🚀',
      isPublic: false,
      tags: ['product'],
      version: 1,
      createdAt: t1.toISOString(),
      updatedAt: t1.toISOString(),
    },
  ];

  saveDocs(docs);
  write(K_TEMPLATES, defaultTemplates);
  saveVersions(welcome, [
    {
      id: uid('ver'),
      documentId: welcome,
      versionNumber: 1,
      title: '👋 Welcome to SyncScribe',
      content: docs[0].content,
      plainText: docs[0].plainText,
      description: 'Initial version',
      authorName: 'Dhruv Sharma',
      createdAt: t0.toISOString(),
    },
  ]);
}

// --------------------------------------------------------------- documentApi
export const localDocumentApi = {
  async getAll(search?: string, tag?: string): Promise<DocumentItem[]> {
    seedIfNeeded();
    let docs = loadDocs();
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.plainText || '').toLowerCase().includes(q)
      );
    }
    if (tag && tag !== 'all') {
      docs = docs.filter((d) => safeParseTags(d.tags).includes(tag));
    }
    docs.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return docs.map(withCounts);
  },

  async getById(id: string): Promise<DocumentItem> {
    seedIfNeeded();
    const docs = loadDocs();
    let doc = docs.find((d) => d.id === id);
    if (!doc) {
      // Mirror the server: opening an unknown doc auto-creates it.
      doc = {
        id,
        title: 'Untitled Document',
        content:
          '<h1>Welcome to SyncScribe</h1><p>Start collaborating in real-time or press <strong>Ctrl+K</strong> for AI assistance.</p>',
        plainText:
          'Welcome to SyncScribe\nStart collaborating in real-time or press Ctrl+K for AI assistance.',
        icon: '📝',
        isPublic: false,
        tags: ['general'],
        version: 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      saveDocs([doc, ...docs]);
    }
    return withCounts(doc);
  },

  async create(
    data: Partial<DocumentItem> & { templateId?: string }
  ): Promise<DocumentItem> {
    seedIfNeeded();
    let template: DocumentTemplate | undefined;
    if (data.templateId) {
      template = read<DocumentTemplate[]>(K_TEMPLATES, []).find(
        (t) => t.id === data.templateId
      );
    }

    const now = nowIso();
    const doc: LocalDocument = {
      id: uid('doc'),
      title: template ? template.title : data.title || 'Untitled Document',
      content:
        template ? template.content : data.content || '<p>Start typing here...</p>',
      plainText:
        template?.content?.replace(/<[^>]*>?/gm, ' ') || data.plainText || '',
      icon: template?.icon || data.icon || '📝',
      isPublic: data.isPublic ?? false,
      ownerId: data.ownerId,
      tags:
        Array.isArray(data.tags) && data.tags.length > 0
          ? data.tags
          : template
            ? [template.category]
            : ['general'],
      version: data.version || 1,
      createdAt: now,
      updatedAt: now,
    };
    saveDocs([doc, ...loadDocs()]);
    return withCounts(doc);
  },

  async update(id: string, data: Partial<DocumentItem>): Promise<DocumentItem> {
    const docs = loadDocs();
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Document ${id} not found`);
    const updated: LocalDocument = {
      ...docs[idx],
      ...data,
      id,
      updatedAt: nowIso(),
    };
    docs[idx] = updated;
    saveDocs(docs);
    return withCounts(updated);
  },

  async delete(id: string): Promise<void> {
    saveDocs(loadDocs().filter((d) => d.id !== id));
    localStorage.removeItem(versionKey(id));
    localStorage.removeItem(commentKey(id));
  },

  async duplicate(id: string): Promise<DocumentItem> {
    const original = loadDocs().find((d) => d.id === id);
    if (!original) throw new Error(`Document ${id} not found`);
    return this.create({
      title: `${original.title} (Copy)`,
      content: original.content,
      plainText: original.plainText,
      icon: original.icon,
      tags: Array.isArray(original.tags) ? original.tags : ['general'],
    });
  },

  getExportUrl(
    id: string,
    format: 'markdown' | 'html' | 'txt' = 'markdown'
  ): string {
    const doc = loadDocs().find((d) => d.id === id);
    if (!doc) return '';
    const safeName = (doc.title || 'document')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    let mime = 'text/markdown';
    let ext = 'md';
    let body = `# ${doc.title}\n\n${doc.plainText || ''}`;
    if (format === 'html') {
      mime = 'text/html';
      ext = 'html';
      body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title}</title></head><body><h1>${doc.title}</h1><div>${doc.content}</div></body></html>`;
    } else if (format === 'txt') {
      mime = 'text/plain';
      ext = 'txt';
      body = doc.plainText || doc.title;
    }
    const blob = new Blob([body], { type: mime });
    return URL.createObjectURL(blob);
  },
};

// --------------------------------------------------------------- versionApi
export const localVersionApi = {
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    seedIfNeeded();
    return loadVersions(documentId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createSnapshot(
    documentId: string,
    description?: string,
    authorName?: string
  ): Promise<DocumentVersion> {
    const doc = loadDocs().find((d) => d.id === documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);
    const versions = loadVersions(documentId);
    const nextNum =
      versions.reduce((m, v) => Math.max(m, v.versionNumber), 0) + 1;
    const snapshot: DocumentVersion = {
      id: uid('ver'),
      documentId,
      versionNumber: nextNum,
      title: doc.title,
      content: doc.content,
      plainText: doc.plainText,
      description: description || `Version ${nextNum}`,
      authorName: authorName || 'Collaborator',
      createdAt: nowIso(),
    };
    saveVersions(documentId, [snapshot, ...versions]);
    const docs = loadDocs();
    const idx = docs.findIndex((d) => d.id === documentId);
    if (idx !== -1) {
      docs[idx] = { ...docs[idx], version: nextNum, updatedAt: nowIso() };
      saveDocs(docs);
    }
    return snapshot;
  },

  async restore(documentId: string, versionId: string): Promise<DocumentItem> {
    const version = loadVersions(documentId).find((v) => v.id === versionId);
    if (!version) throw new Error('Version not found');
    const docs = loadDocs();
    const idx = docs.findIndex((d) => d.id === documentId);
    if (idx === -1) throw new Error('Document not found');

    const restored: LocalDocument = {
      ...docs[idx],
      title: version.title,
      content: version.content,
      plainText: version.plainText,
      updatedAt: nowIso(),
    };
    docs[idx] = restored;
    saveDocs(docs);

    // Record a restore snapshot, mirroring the server behaviour.
    await this.createSnapshot(
      documentId,
      `Restored from Version ${version.versionNumber}`,
      'System Restore'
    );
    return withCounts(restored);
  },
};

// --------------------------------------------------------------- commentApi
export const localCommentApi = {
  async getComments(documentId: string): Promise<CommentItem[]> {
    return loadComments(documentId);
  },

  async createComment(
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
  ): Promise<CommentItem> {
    if (!data.text || !data.text.trim()) throw new Error('Comment text is required');
    const comment: CommentItem = {
      id: uid('com'),
      documentId,
      authorName: data.authorName || 'Anonymous',
      authorAvatar: data.authorAvatar,
      authorColor: data.authorColor || '#3b82f6',
      text: data.text.trim(),
      selectedText: data.selectedText,
      rangeStart: data.rangeStart,
      rangeEnd: data.rangeEnd,
      resolved: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      replies: [],
    };
    saveComments(documentId, [comment, ...loadComments(documentId)]);
    return comment;
  },

  async updateComment(
    commentId: string,
    data: { text?: string; resolved?: boolean }
  ): Promise<CommentItem> {
    let updated: CommentItem | null = null;
    for (const [docId, comments] of allComments()) {
      const rebuilt = comments.map((c) => {
        if (c.id !== commentId) return c;
        updated = {
          ...c,
          text: data.text !== undefined ? data.text : c.text,
          resolved: data.resolved !== undefined ? data.resolved : c.resolved,
          updatedAt: nowIso(),
        };
        return updated;
      });
      saveComments(docId, rebuilt);
    }
    if (!updated) throw new Error(`Comment ${commentId} not found`);
    return updated;
  },

  async addReply(
    commentId: string,
    data: {
      authorName: string;
      authorAvatar?: string;
      authorColor?: string;
      text: string;
    }
  ): Promise<CommentReply> {
    const reply: CommentReply = {
      id: uid('rep'),
      commentId,
      authorName: data.authorName || 'Anonymous',
      authorAvatar: data.authorAvatar,
      authorColor: data.authorColor || '#3b82f6',
      text: data.text.trim(),
      createdAt: nowIso(),
    };
    for (const [docId, comments] of allComments()) {
      const rebuilt = comments.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), reply] }
          : c
      );
      saveComments(docId, rebuilt);
    }
    return reply;
  },

  async deleteComment(commentId: string): Promise<void> {
    for (const [docId, comments] of allComments()) {
      saveComments(
        docId,
        comments.filter((c) => c.id !== commentId)
      );
    }
  },
};

// --------------------------------------------------------------- templateApi
export const localTemplateApi = {
  async getAll(): Promise<DocumentTemplate[]> {
    seedIfNeeded();
    const stored = read<DocumentTemplate[]>(K_TEMPLATES, []);
    if (stored.length === 0) {
      write(K_TEMPLATES, defaultTemplates);
      return defaultTemplates;
    }
    return stored;
  },

  async getById(id: string): Promise<DocumentTemplate> {
    const all = await this.getAll();
    const t =
      all.find((tpl) => tpl.id === id) ||
      defaultTemplates.find((tpl) => tpl.id === id);
    if (!t) throw new Error('Template not found');
    return t;
  },
};

// --------------------------------------------------------------- aiApi (offline demo engine)
export const localAiApi = {
  async generate(
    promptOrData: string | { prompt: string; context?: string; mode?: string },
    context?: string
  ): Promise<{ text: string }> {
    const prompt =
      typeof promptOrData === 'string' ? promptOrData : promptOrData.prompt || '';
    const ctx =
      (typeof promptOrData === 'string' ? context : promptOrData.context) || '';

    const text = await executeAICompletion(prompt, ctx);
    return { text };
  },

  async rewrite(data: {
    text: string;
    instruction?: string;
    tone?: string;
    mode?: string;
    context?: string;
  }): Promise<{ text: string }> {
    const text = await executeAIRewrite(data);
    return { text };
  },

  async chat(
    messagesOrObj:
      | Array<{ role: string; content: string }>
      | { message: string; documentContext?: string },
    documentContext?: string
  ): Promise<{ response: string; answer?: string; text?: string }> {
    const last = Array.isArray(messagesOrObj)
      ? messagesOrObj[messagesOrObj.length - 1]?.content || ''
      : messagesOrObj.message || '';
    const ctx = Array.isArray(messagesOrObj)
      ? documentContext
      : messagesOrObj.documentContext || '';

    const response = await executeAICompletion(
      last,
      ctx,
      `${SYSTEM_PROMPT}${ctx ? `\n\nActive Document Context:\n${ctx}` : ''}`
    );
    return { response, answer: response, text: response };
  },

  async summarize(text: string, format?: string): Promise<{ summary: string }> {
    const summary = await executeAICompletion(
      `Summarize the following document into a crisp, well-structured executive summary ${
        format === 'bullet-points' ? 'using bullet points' : 'with key highlights'
      }:\n\n${text}`,
      text
    );
    return { summary };
  },

  async extractActionItems(text: string): Promise<{ actionItems: any }> {
    const lines = (text || '').split('\n');
    const items = lines
      .filter((l) => /\[ \]|[-*•]|action|todo|follow\s*up|deliver/i.test(l))
      .slice(0, 6)
      .map((l, i) => ({
        id: `ai-item-${i + 1}`,
        text:
          l.replace(/^[-*•\s[\]]+/g, '').replace(/<[^>]*>/g, '').slice(0, 120) ||
          l.slice(0, 120),
        owner: 'Unassigned',
        status: 'open',
      }));
    return {
      actionItems: items.length
        ? items
        : [{ id: 'ai-item-1', text: 'Confirm deliverable scope and project timelines.', owner: 'Tech Lead', status: 'open' }],
    };
  },

  async generateFaq(text: string): Promise<{ faq: any }> {
    return {
      faq: [
        { question: 'What is the objective of this document?', answer: text.slice(0, 120) || 'Defines scope and key implementation steps.' },
        { question: 'Who are the primary stakeholders?', answer: 'Project leads, technical architects, and collaborative team members.' },
        { question: 'What are the immediate next steps?', answer: 'Review open action items and execute phase 1 deliverables.' },
      ],
    };
  },

  async translate(
    text: string,
    targetLanguage: string
  ): Promise<{ translatedText: string; targetLanguage: string }> {
    const translatedText = await executeAITranslation(text, targetLanguage);
    return { translatedText, targetLanguage };
  },
};