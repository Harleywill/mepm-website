import { NextResponse } from 'next/server';
import { verifyAuthWithUser } from '@/lib/auth';
import { PERMS } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

/**
 * GET /api/roles
 * Returns current user's role and permissions
 * Requires authentication (no specific permission, just authenticated)
 * Returns: { user: { username, role }, permissions: ["edit", "delete", ...] }
 */
export async function GET() {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Get permissions for this role, convert Set to array
  const permissions = Array.from(
    PERMS[user.role as keyof typeof PERMS] || new Set()
  );

  return NextResponse.json({
    user: {
      username: user.username,
      role: user.role,
    },
    permissions,
  });
}
