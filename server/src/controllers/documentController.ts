import { Request, Response } from 'express';
import prisma from '../db';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../services/activityLogger';


export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    const { search, tag } = req.query;
    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { plainText: { contains: search } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            comments: true,
            versions: true,
          },
        },
      },
    });

    let filtered = documents;
    if (tag && typeof tag === 'string') {
      filtered = documents.filter((doc) => {
        try {
          const tags = JSON.parse(doc.tags || '[]');
          return Array.isArray(tags) && tags.includes(tag);
        } catch {
          return false;
        }
      });
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let document = await prisma.document.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            replies: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!document) {
      document = await prisma.document.create({
        data: {
          id,
          title: 'Untitled Document',
          content: '<h1>Welcome to SyncScribe</h1><p>Start collaborating in real-time or press <strong>Ctrl+K</strong> for AI assistance.</p>',
          plainText: 'Welcome to SyncScribe\nStart collaborating in real-time or press Ctrl+K for AI assistance.',
          icon: '📝',
          tags: JSON.stringify(['general']),
        },
        include: {
          comments: {
            include: {
              replies: true,
            },
          },
          versions: true,
        },
      });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, content, plainText, icon, tags, templateId } = req.body;
    let initialTitle = title || 'Untitled Document';
    let initialContent = content || '<p></p>';
    let initialPlainText = plainText || '';
    let initialIcon = icon || '📝';
    let initialTags = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify(['general']);

    if (templateId) {
      const template = await prisma.documentTemplate.findUnique({
        where: { id: templateId },
      });
      if (template) {
        initialTitle = template.name;
        initialContent = template.content;
        initialIcon = template.icon;
        initialTags = JSON.stringify([template.category.toLowerCase()]);
      }
    }

    const document = await prisma.document.create({
      data: {
        id: uuidv4(),
        title: initialTitle,
        content: initialContent,
        plainText: initialPlainText,
        icon: initialIcon,
        tags: initialTags,
        version: 1,
      },
    });

    logActivity({
      action: 'DOCUMENT_CREATED',
      entityType: 'document',
      entityId: document.id,
      details: `Created new document "${document.title}"`,
      metadata: { templateId: req.body.templateId },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};


export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, plainText, summary, icon, coverImage, isPublic, tags } = req.body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (content !== undefined) dataToUpdate.content = content;
    if (plainText !== undefined) dataToUpdate.plainText = plainText;
    if (summary !== undefined) dataToUpdate.summary = summary;
    if (icon !== undefined) dataToUpdate.icon = icon;
    if (coverImage !== undefined) dataToUpdate.coverImage = coverImage;
    if (isPublic !== undefined) dataToUpdate.isPublic = isPublic;
    if (tags !== undefined) {
      dataToUpdate.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: dataToUpdate,
    });

    logActivity({
      action: 'DOCUMENT_UPDATED',
      entityType: 'document',
      entityId: id,
      details: `Updated document "${updatedDocument.title}"`,
      metadata: { fieldsUpdated: Object.keys(dataToUpdate) },
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({ where: { id } });

    logActivity({
      action: 'DOCUMENT_DELETED',
      entityType: 'document',
      entityId: id,
      details: `Deleted document with ID ${id}`,
    });

    res.json({ message: 'Document deleted successfully', id });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const duplicateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const original = await prisma.document.findUnique({ where: { id } });

    if (!original) {
      return res.status(404).json({ error: 'Original document not found' });
    }

    const duplicated = await prisma.document.create({
      data: {
        id: uuidv4(),
        title: `${original.title} (Copy)`,
        content: original.content,
        plainText: original.plainText,
        icon: original.icon,
        tags: original.tags,
      },
    });

    logActivity({
      action: 'DOCUMENT_DUPLICATED',
      entityType: 'document',
      entityId: duplicated.id,
      details: `Duplicated "${original.title}" into "${duplicated.title}"`,
      metadata: { originalId: id },
    });

    res.status(201).json(duplicated);
  } catch (error) {
    console.error('Error duplicating document:', error);
    res.status(500).json({ error: 'Failed to duplicate document' });
  }
};

export const exportDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'markdown' } = req.query;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = sanitizeFilename(document.title);

    if (format === 'html') {
      const htmlPage = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${document.title}</title><style>body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; } h1, h2, h3 { color: #0f172a; } pre { background: #f1f5f9; padding: 12px; border-radius: 6px; } code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; } blockquote { border-left: 4px solid #3b82f6; margin: 0; padding-left: 16px; color: #64748b; }</style></head><body><h1>${document.title}</h1><div>${document.content}</div></body></html>`;
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
      return res.send(htmlPage);
    }

    if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
      return res.send(document.plainText || document.title);
    }

    const markdown = `# ${document.title}\n\n${document.plainText || ''}`;
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Error exporting document:', error);
    res.status(500).json({ error: 'Failed to export document' });
  }
};

