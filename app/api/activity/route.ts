import { NextResponse } from 'next/server';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { getRecentActivity } from '@/lib/activity';
import type { Role } from '@/lib/roles';

/** Admin: the last 100 content changes, most recent first. */
export async function GET() {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'browse')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const activity = await getRecentActivity(100);
  return NextResponse.json({ activity });
}
