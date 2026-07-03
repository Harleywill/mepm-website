import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { isValidDiscipline } from '@/lib/team';
import { validateFiles, saveUpload, deleteUpload, IMAGE_DOC_TYPES } from '@/lib/uploads';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import type { Role } from '@/lib/roles';

/** Admin: get one team member. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const member = await prisma.team.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ member });
}

/** Admin: update a team member with optional photo upload. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const member = await prisma.team.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const formData = await req.formData();

  // Build update object from provided fields
  const data: Record<string, unknown> = {};

  if (formData.has('name')) {
    const name = String(formData.get('name') || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    // Check uniqueness (excluding current member)
    const conflict = await prisma.team.findUnique({ where: { name } });
    if (conflict && conflict.id !== id) {
      return NextResponse.json(
        { error: 'A team member with this name already exists' },
        { status: 400 }
      );
    }
    data.name = name;
  }

  if (formData.has('role')) {
    const role = String(formData.get('role') || '').trim();
    if (!role) {
      return NextResponse.json({ error: 'Role cannot be empty' }, { status: 400 });
    }
    // Only administrators can change the role
    if (role !== member.role && user.role !== 'administrator') {
      return NextResponse.json(
        { error: 'Only administrators can change member roles' },
        { status: 403 }
      );
    }
    data.role = role;
  }

  if (formData.has('discipline')) {
    const discipline = String(formData.get('discipline') || '').toUpperCase();
    if (!isValidDiscipline(discipline)) {
      return NextResponse.json(
        { error: 'Discipline must be ELE, MEC, or ENV' },
        { status: 400 }
      );
    }
    data.discipline = discipline;
  }

  if (formData.has('bio')) {
    data.bio = String(formData.get('bio') || '');
  }

  if (formData.has('order')) {
    data.order = Number(formData.get('order')) || 0;
  }

  // Handle optional photo upload
  const photoFile = formData.get('photo');
  if (photoFile instanceof File) {
    const validateErr = validateFiles([photoFile], {
      maxFiles: 1,
      maxSizeMB: 5,
      allowedTypes: IMAGE_DOC_TYPES.filter((t) => t.startsWith('image/')),
    });
    if (validateErr) {
      return NextResponse.json({ error: validateErr }, { status: 400 });
    }

    // Delete old photo if it exists
    if (member.photo) {
      await deleteUpload(member.photo);
    }

    const saved = await saveUpload(photoFile, 'public/uploads/team');
    data.photo = saved.storedPath;
  }

  // Only update if there are changes
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ member });
  }

  const updated = await prisma.team.update({
    where: { id },
    data,
  });

  revalidatePublicSite();
  await logActivity({
    action: 'update',
    entityType: 'Team',
    entityId: updated.id,
    entityLabel: updated.name,
    username: user.username,
  });

  return NextResponse.json({ member: updated });
}

/** Admin: delete a team member and remove photo if exists. */
export async function DELETE(
  _req: Request,
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
  const member = await prisma.team.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Delete photo if it exists
  if (member.photo) {
    await deleteUpload(member.photo);
  }

  await prisma.team.delete({ where: { id } });
  revalidatePublicSite();
  await logActivity({
    action: 'delete',
    entityType: 'Team',
    entityId: member.id,
    entityLabel: member.name,
    username: user.username,
  });
  return NextResponse.json({ ok: true });
}
