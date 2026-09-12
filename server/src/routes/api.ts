import { Router } from 'express';
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  duplicateDocument,
  exportDocument,
} from '../controllers/documentController';
import {
  getDocumentVersions,
  createVersionSnapshot,
  restoreVersion,
} from '../controllers/versionController';
import {
  getDocumentComments,
  createComment,
  updateComment,
  addCommentReply,
  deleteComment,
} from '../controllers/commentController';
import { getAllTemplates, getTemplateById } from '../controllers/templateController';
import {
  generateText,
  rewriteText,
  chatWithDocument,
  summarizeDocument,
  translateText,
} from '../controllers/aiController';
import devRoutes from './devRoutes';


const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'syncscribe-server', timestamp: new Date().toISOString() });
});

// Document Routes
router.get('/documents', getAllDocuments);
router.get('/documents/:id', getDocumentById);
router.post('/documents', createDocument);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', deleteDocument);
router.post('/documents/:id/duplicate', duplicateDocument);
router.get('/documents/:id/export', exportDocument);

// Version History Routes
router.get('/documents/:documentId/versions', getDocumentVersions);
router.post('/documents/:documentId/versions', createVersionSnapshot);
router.post('/documents/:documentId/versions/:versionId/restore', restoreVersion);

// Comment Routes
router.get('/documents/:documentId/comments', getDocumentComments);
router.post('/documents/:documentId/comments', createComment);
router.put('/comments/:commentId', updateComment);
router.post('/comments/:commentId/replies', addCommentReply);
router.delete('/comments/:commentId', deleteComment);

// Template Routes
router.get('/templates', getAllTemplates);
router.get('/templates/:id', getTemplateById);

// AI Microservice Proxy Routes
router.post('/ai/generate', generateText);
router.post('/ai/rewrite', rewriteText);
router.post('/ai/chat', chatWithDocument);
router.post('/ai/summarize', summarizeDocument);
router.post('/ai/translate', translateText);

// Developer Telemetry & Database Activity Routes
router.use('/dev', devRoutes);


export default router;
