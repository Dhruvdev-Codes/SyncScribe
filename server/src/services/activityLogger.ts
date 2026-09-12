import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  metadata?: any;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    const record = await prisma.activityLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
        userId: params.userId,
        userName: params.userName || 'Anonymous',
        ipAddress: params.ipAddress,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
    return record;
  } catch (error) {
    console.error('Failed to write activity log:', error);
    return null;
  }
};

export const logDevActivity = async (data: {
  developerName?: string;
  actionType: string;
  description: string;
  status?: string;
  branch?: string;
  commitHash?: string;
}) => {
  try {
    const record = await prisma.devActivity.create({
      data: {
        developerName: data.developerName || 'Dhruv',
        actionType: data.actionType,
        description: data.description,
        status: data.status || 'completed',
        branch: data.branch || 'main',
        commitHash: data.commitHash,
      },
    });
    return record;
  } catch (error) {
    console.error('Failed to write dev activity:', error);
    return null;
  }
};
