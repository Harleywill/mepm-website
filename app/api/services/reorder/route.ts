import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import type { Role } from '@/lib/roles';

/** Admin: persist a new drag-and-drop order for all services. Body: { ids: string[] } in the new order. */
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
      prisma.service.update({ where: { id }, data: { order: index } })
    )
  );

  await logActivity({
    action: 'update',
    entityType: 'Service',
    entityId: 'bulk',
    entityLabel: `${ids.length} disciplines reordered`,
    username: user.username,
  });

  return NextResponse.json({ ok: true });
}
