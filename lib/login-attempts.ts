import { prisma } from '@/lib/db';

export interface LoginAttemptDTO {
  id: string;
  username: string;
  success: boolean;
  ipAddress: string;
  createdAt: string;
}

/**
 * Record a login attempt (success or failure). Never throws — logging must
 * never block the actual auth flow it's describing.
 */
export async function logLoginAttempt(entry: {
  username: string;
  success: boolean;
  ipAddress: string;
}): Promise<void> {
  try {
    await prisma.loginAttempt.create({ data: entry });
  } catch (error) {
    console.error('logLoginAttempt: failed to write login attempt', error);
  }
}

export async function getRecentLoginAttempts(limit: number = 100): Promise<LoginAttemptDTO[]> {
  try {
    const rows = await prisma.loginAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      success: row.success,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('getRecentLoginAttempts: database query failed', error);
    return [];
  }
}
