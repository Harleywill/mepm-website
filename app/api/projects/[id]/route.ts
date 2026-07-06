import { NextResponse } from 'next/server';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { verifyAuth, verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import type { Role } from '@/lib/roles';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import { disciplinesFromArray, isProjectStatus } from '@/lib/projects';

async function requireAuth() {
  await verifyAuth();
}

/** Admin: fetch one project with images. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ project });
}

/** Admin: update a project. */
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
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') data.title = body.title.trim();
  if ('client' in body) data.client = body.client?.trim() || null;
  if ('location' in body) data.location = body.location?.trim() || null;
  if ('sector' in body) data.sector = body.sector?.trim() || null;
  if ('disciplines' in body)
    data.disciplines = disciplinesFromArray(body.disciplines ?? []);
  if (typeof body.status === 'string' && isProjectStatus(body.status))
    data.status = body.status;
  if ('year' in body) data.year = body.year ? Number(body.year) : null;
  if ('summary' in body) data.summary = String(body.summary || '');
  if ('detail' in body) data.detail = String(body.detail || '');
  if ('featured' in body) data.featured = Boolean(body.featured);
  if ('published' in body) data.published = Boolean(body.published);
  if ('order' in body) data.order = Number(body.order) || 0;

  const project = await prisma.project.update({
    where: { id },
    data,
    include: { images: { orderBy: { order: 'asc' } } },
  });
  revalidatePublicSite();
  await logActivity({
    action: 'update',
    entityType: 'Project',
    entityId: project.id,
    entityLabel: project.title,
    username: user.username,
  });
  return NextResponse.json({ project });
}

/** Admin: delete a project and its image files. */
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
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Remove the whole project image directory, then the DB row (cascade).
  await rm(path.join(process.cwd(), 'public/uploads/projects', id), {
    recursive: true,
    force: true,
  }).catch(() => {});
  await prisma.project.delete({ where: { id } });
  revalidatePublicSite();
  await logActivity({
    action: 'delete',
    entityType: 'Project',
    entityId: project.id,
    entityLabel: project.title,
    username: user.username,
  });
  return NextResponse.json({ ok: true });
}
