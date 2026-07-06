import { NextResponse } from 'next/server';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { getRecentLoginAttempts } from '@/lib/login-attempts';
import type { Role } from '@/lib/roles';

/** Administrator only: the last 100 login attempts, most recent first. */
export async function GET() {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'system')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const attempts = await getRecentLoginAttempts(100);
  return NextResponse.json({ attempts });
}
