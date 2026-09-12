// Browser environment mockup
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (i) => Array.from(store.keys())[i] || null,
};

globalThis.window = {
  location: {
    hostname: 'dhruvdev-codes.github.io',
    origin: 'https://dhruvdev-codes.github.io',
    pathname: '/SyncScribe/',
    search: '',
  },
};

globalThis.Blob = class Blob {
  constructor(parts, opts = {}) {
    this.parts = parts;
    this.type = opts.type || '';
  }
};

// Preserve native URL constructor
const NativeURL = globalThis.URL;
if (NativeURL) {
  NativeURL.createObjectURL = (blob) => `blob:mock-url-${Math.random().toString(36).slice(2)}`;
  NativeURL.revokeObjectURL = () => {};
}

import { documentApi, versionApi, commentApi, templateApi, aiApi, isLocalMode, modeReady } from './src/services/api.ts';

async function run() {
  console.log('--- STARTING SYNCSCRIBE CLIENT TEST ---');

  const isLocal = await modeReady();
  console.log(`[TEST 1] Mode ready: isLocal=${isLocal} (expected: true)`);
  if (!isLocal) throw new Error('Expected local mode on GitHub Pages hostname!');

  const initialDocs = await documentApi.getAll();
  console.log(`[TEST 2] Initial seeded documents count: ${initialDocs.length}`);
  if (initialDocs.length < 2) throw new Error('Expected at least 2 seeded docs');
  console.log('         Seeded titles:', initialDocs.map(d => d.title).join(', '));

  console.log('\n[TEST 3] Creating a new document...');
  const newDoc = await documentApi.create({
    title: 'Automated E2E Test Document',
    content: '<h1>E2E Test</h1><p>Created by automated verification test suite.</p>',
    plainText: 'E2E Test. Created by automated verification test suite.',
    tags: ['test', 'automated', 'engineering'],
    icon: '🧪'
  });
  console.log('         Created doc ID:', newDoc.id);
  console.log('         Created title:', newDoc.title);
  if (!newDoc.id || newDoc.title !== 'Automated E2E Test Document') {
    throw new Error('Failed to create document properly');
  }

  console.log('\n[TEST 4] Retrieving created document by ID...');
  const fetchedDoc = await documentApi.getById(newDoc.id);
  if (fetchedDoc.id !== newDoc.id || fetchedDoc.title !== newDoc.title) {
    throw new Error('Retrieved doc does not match created doc');
  }
  console.log('         Fetched successfully:', fetchedDoc.title);

  console.log('\n[TEST 5] Updating document title and content...');
  const updatedDoc = await documentApi.update(newDoc.id, {
    title: 'Automated E2E Test Document (Updated)',
    content: '<h1>E2E Test (Updated)</h1><p>Updated content with real-time sync simulation.</p>',
    plainText: 'E2E Test (Updated). Updated content with real-time sync simulation.',
  });
  if (updatedDoc.title !== 'Automated E2E Test Document (Updated)') {
    throw new Error('Update title failed');
  }
  console.log('         Updated title successfully:', updatedDoc.title);

  console.log('\n[TEST 6] Creating a version snapshot...');
  const version = await versionApi.createSnapshot(newDoc.id, 'Release v1.0.0', 'Test Runner');
  console.log(`         Created version #${version.versionNumber} with ID: ${version.id}`);
  const versions = await versionApi.getVersions(newDoc.id);
  if (versions.length === 0) throw new Error('Failed to list document versions');

  console.log('\n[TEST 7] Adding a comment and a reply...');
  const comment = await commentApi.createComment(newDoc.id, {
    authorName: 'Dhruv',
    text: 'Please review this test document content before deploying.',
  });
  const reply = await commentApi.addReply(comment.id, {
    authorName: 'AI Reviewer',
    text: 'Looks solid! Ready for production.',
  });
  const comments = await commentApi.getComments(newDoc.id);
  if (comments.length !== 1 || (comments[0].replies || []).length !== 1) {
    throw new Error('Comment or reply count mismatch');
  }

  console.log('\n[TEST 8] Fetching default templates and creating documents from templates...');
  const templates = await templateApi.getAll();
  console.log(`         Found ${templates.length} templates`);
  if (templates.length === 0) throw new Error('Templates list is empty');

  for (const tpl of templates) {
    const docFromTpl = await documentApi.create({
      title: tpl.title,
      content: tpl.content,
      plainText: tpl.content.replace(/<[^>]*>?/gm, ' '),
      icon: tpl.icon || '📝',
      tags: [tpl.category || 'template'],
    });
    console.log(`         Created doc from template '${tpl.title}' -> ID: ${docFromTpl.id}`);
    const verified = await documentApi.getById(docFromTpl.id);
    if (!verified || verified.title !== tpl.title) {
      throw new Error(`Failed to verify document created from template ${tpl.id}`);
    }
  }

  console.log('\n[TEST 9] Testing AI Generation & Chat offline engine...');
  const genResult = await aiApi.generate({ prompt: 'Engineering meeting agenda' });
  console.log('         AI Generation sample:\n' + genResult.text.slice(0, 120) + '...\n');

  console.log('\n[TEST 10] Testing Search and Filter...');
  const searchResults = await documentApi.getAll('Automated');
  console.log(`         Found ${searchResults.length} docs matching 'Automated'`);
  if (searchResults.length === 0) throw new Error('Search failed to find newly created document');

  console.log('\n[TEST 11] Testing Document Export URLs...');
  const mdUrl = documentApi.getExportUrl(newDoc.id, 'markdown');
  console.log('         Markdown export URL:', mdUrl);
  if (!mdUrl) throw new Error('Export URL generation failed');

  console.log('\n🎉 ALL 11 INTEGRATION TESTS PASSED CLEANLY');
}

run().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});

