import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import type { Role } from '@/lib/roles';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'delete')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const { id } = await params;

  const accreditation = await prisma.accreditation.delete({
    where: { id },
  });

  revalidatePublicSite();
  await logActivity({
    action: 'delete',
    entityType: 'Accreditation',
    entityId: accreditation.id,
    entityLabel: accreditation.label,
    username: user.username,
  });

  return NextResponse.json(accreditation);
}
