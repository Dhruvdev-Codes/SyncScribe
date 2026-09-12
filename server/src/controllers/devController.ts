import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';
import { logActivity, logDevActivity } from '../services/activityLogger';

const prisma = new PrismaClient();

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { limit = '50', page = '1', entityType, action } = req.query;
    const take = parseInt(limit as string, 10) || 50;
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = {};
    if (entityType) where.entityType = String(entityType);
    if (action) where.action = { contains: String(action) };

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      activities,
      total,
      page: parseInt(page as string, 10),
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const { action, entityType, entityId, details, userId, userName, metadata } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const activity = await logActivity({
      action: action || 'MANUAL_DEV_EVENT',
      entityType: entityType || 'dev',
      entityId,
      details,
      userId,
      userName: userName || 'Developer',
      ipAddress,
      metadata,
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
};

export const getDevActivities = async (_req: Request, res: Response) => {
  try {
    const devTasks = await prisma.devActivity.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(devTasks);
  } catch (error) {
    console.error('Error fetching dev activities:', error);
    res.status(500).json({ error: 'Failed to fetch developer activity items' });
  }
};

export const recordDevTask = async (req: Request, res: Response) => {
  try {
    const { developerName, actionType, description, status, branch, commitHash } = req.body;
    const task = await logDevActivity({
      developerName,
      actionType,
      description,
      status,
      branch,
      commitHash,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Error logging dev task:', error);
    res.status(500).json({ error: 'Failed to log dev task' });
  }
};

export const getProjectStats = async (_req: Request, res: Response) => {
  try {
    const [docCount, versionCount, commentCount, activityCount, templateCount, recentActivities] = await Promise.all([
      prisma.document.count(),
      prisma.documentVersion.count(),
      prisma.comment.count(),
      prisma.activityLog.count(),
      prisma.documentTemplate.count(),
      prisma.activityLog.findMany({ take: 8, orderBy: { createdAt: 'desc' } }),
    ]);

    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      freeMemMB: Math.round(os.freemem() / 1024 / 1024),
    };

    res.json({
      database: {
        totalDocuments: docCount,
        totalVersions: versionCount,
        totalComments: commentCount,
        totalActivities: activityCount,
        totalTemplates: templateCount,
      },
      system: systemInfo,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
};

export const getProjectDetails = async (_req: Request, res: Response) => {
  try {
    res.json({
      name: 'SyncScribe',
      description: 'Real-Time Collaborative Document Editor with AI Integration & Multiplayer OT/CRDT Sync',
      version: '1.0.0',
      developer: 'Dhruv (Lead Fullstack AI Engineer)',
      repository: 'https://github.com/Dhruvdev-Codes/SyncScribe',
      techStack: {
        frontend: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Tiptap ProseMirror', 'Socket.IO Client', 'Lucide Icons'],
        backend: ['Node.js', 'Express', 'TypeScript', 'Socket.IO Server', 'Prisma ORM', 'SQLite'],
        aiService: ['FastAPI (Python)', 'OpenAI API Client', 'Heuristic Offline Fallback'],
      },
      status: 'operational',
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
};

export const exportProjectData = async (_req: Request, res: Response) => {
  try {
    const [documents, versions, comments, activities, devTasks] = await Promise.all([
      prisma.document.findMany(),
      prisma.documentVersion.findMany(),
      prisma.comment.findMany({ include: { replies: true } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.devActivity.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      project: 'SyncScribe',
      data: { documents, versions, comments, activities, devTasks },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export project data' });
  }
};
