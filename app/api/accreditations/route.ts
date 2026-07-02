import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import type { Role } from '@/lib/roles';

/** Public: list all accreditations. */
export async function GET() {
  const accreditations = await prisma.accreditation.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(accreditations);
}

/** Admin: create a new accreditation. */
export async function POST(req: Request) {
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
  const label = String(body.label || '').trim();

  if (!label) {
    return NextResponse.json(
      { error: 'Label is required' },
      { status: 400 }
    );
  }

  // Get max order
  const last = await prisma.accreditation.findFirst({
    orderBy: { order: 'desc' },
  });
  const order = (last?.order ?? -1) + 1;

  const accreditation = await prisma.accreditation.create({
    data: { label, order },
  });

  await logActivity({
    action: 'create',
    entityType: 'Accreditation',
    entityId: accreditation.id,
    entityLabel: accreditation.label,
    username: user.username,
  });

  return NextResponse.json(accreditation, { status: 201 });
}
