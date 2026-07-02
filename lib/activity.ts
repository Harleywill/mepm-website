import { prisma } from '@/lib/db';

export type ActivityAction = 'create' | 'update' | 'delete';

export interface ActivityLogDTO {
  id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  username: string;
  createdAt: string;
}

/**
 * Record an admin content change. Never throws — a logging failure should
 * never block or roll back the actual mutation it's describing.
 */
export async function logActivity(entry: {
  action: ActivityAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  username: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({ data: entry });
  } catch (error) {
    console.error('logActivity: failed to write activity log entry', error);
  }
}

export async function getRecentActivity(limit: number = 100): Promise<ActivityLogDTO[]> {
  try {
    const rows = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      action: row.action as ActivityAction,
      entityType: row.entityType,
      entityId: row.entityId,
      entityLabel: row.entityLabel,
      username: row.username,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('getRecentActivity: database query failed', error);
    return [];
  }
}
