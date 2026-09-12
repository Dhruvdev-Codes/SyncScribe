import { Request, Response } from 'express';
import prisma from '../db';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../services/activityLogger';


export const getDocumentVersions = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(versions);
  } catch (error) {
    console.error('Error fetching document versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
};

export const createVersionSnapshot = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { description, authorName } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    const version = await prisma.documentVersion.create({
      data: {
        id: uuidv4(),
        documentId,
        versionNumber: nextVersionNumber,
        title: document.title,
        content: document.content,
        plainText: document.plainText,
        description: description || `Version ${nextVersionNumber}`,
        authorName: authorName || 'Collaborator',
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { version: nextVersionNumber },
    });

    logActivity({
      action: 'SNAPSHOT_CREATED',
      entityType: 'version',
      entityId: version.id,
      details: `Created snapshot v${nextVersionNumber}: "${version.title}" - ${version.description}`,
      userName: authorName || 'Collaborator',
      metadata: { documentId, versionNumber: nextVersionNumber },
    });

    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating version snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
};

export const restoreVersion = async (req: Request, res: Response) => {
  try {
    const { documentId, versionId } = req.params;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.documentId !== documentId) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        title: version.title,
        content: version.content,
        plainText: version.plainText,
      },
    });

    // Create a new snapshot recording the restore action
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    await prisma.documentVersion.create({
      data: {
        id: uuidv4(),
        documentId,
        versionNumber: nextVersionNumber,
        title: version.title,
        content: version.content,
        plainText: version.plainText,
        description: `Restored from Version ${version.versionNumber}`,
        authorName: 'System Restore',
      },
    });

    logActivity({
      action: 'VERSION_RESTORED',
      entityType: 'version',
      entityId: version.id,
      details: `Restored document "${version.title}" to version v${version.versionNumber}`,
      userName: 'Developer/User',
      metadata: { documentId, restoredVersionNumber: version.versionNumber },
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Error restoring document version:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
};
