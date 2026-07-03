import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import type { Role } from '@/lib/roles';

/** Admin: persist a new drag-and-drop order for all team members. Body: { ids: string[] } in the new order. */
export async function PATCH(req: Request) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'edit')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((id: string, index: number) =>
      prisma.team.update({ where: { id }, data: { order: index } })
    )
  );

  revalidatePublicSite();
  await logActivity({
    action: 'update',
    entityType: 'Team',
    entityId: 'bulk',
    entityLabel: `${ids.length} team members reordered`,
    username: user.username,
  });

  return NextResponse.json({ ok: true });
}
