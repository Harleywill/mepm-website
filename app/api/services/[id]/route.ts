import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateService, stringifyJsonArray, isValidServiceCode } from '@/lib/services';
import { logActivity } from '@/lib/activity';
import type { Role } from '@/lib/roles';

async function requireAuth() {
  return verifyAuthWithUser();
}

/** Admin: fetch one service by id. */
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
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ service });
}

/** Admin: update a service (partial updates allowed). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
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

  if ('code' in body) {
    const code = String(body.code || '').toUpperCase();
    if (!isValidServiceCode(code)) {
      return NextResponse.json({ error: 'Code must be ELE, MEC, or ENV' }, { status: 400 });
    }
    data.code = code;
  }
  if ('slug' in body) {
    const slug = String(body.slug || '').trim();
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    data.slug = slug;
  }
  if ('name' in body) {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    data.name = name;
  }
  if ('navLabel' in body) data.navLabel = String(body.navLabel || '').trim();
  if ('shortDescription' in body) {
    const shortDescription = String(body.shortDescription || '').trim();
    if (!shortDescription) return NextResponse.json({ error: 'Short description is required' }, { status: 400 });
    data.shortDescription = shortDescription;
  }
  if ('intro' in body) data.intro = String(body.intro || '').trim();
  if ('keywords' in body) data.keywords = stringifyJsonArray(body.keywords || []);
  if ('scope' in body) data.scope = stringifyJsonArray(body.scope || []);
  if ('deliverables' in body) data.deliverables = stringifyJsonArray(body.deliverables || []);
  if ('sustainability' in body) data.sustainability = String(body.sustainability || '');
  if ('relatedSlugs' in body) data.relatedSlugs = stringifyJsonArray(body.relatedSlugs || []);
  if ('statValue' in body) data.statValue = String(body.statValue || '');
  if ('statLabel' in body) data.statLabel = String(body.statLabel || '');
  if ('order' in body) data.order = Number(body.order) || 0;
  if ('published' in body) data.published = Boolean(body.published);
  if ('icon' in body) data.icon = String(body.icon || 'Zap');

  if ('code' in data) {
    const existing = await prisma.service.findUnique({ where: { code: data.code as string } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Service with code "${data.code}" already exists` }, { status: 400 });
    }
  }
  if ('slug' in data) {
    const existing = await prisma.service.findUnique({ where: { slug: data.slug as string } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Service with slug "${data.slug}" already exists` }, { status: 400 });
    }
  }

  const service = await prisma.service.update({ where: { id }, data });
  await logActivity({
    action: 'update',
    entityType: 'Service',
    entityId: service.id,
    entityLabel: service.name,
    username: user.username,
  });
  return NextResponse.json({ service });
}

/** Admin: delete a service. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'delete')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await prisma.service.delete({ where: { id } });
  await logActivity({
    action: 'delete',
    entityType: 'Service',
    entityId: service.id,
    entityLabel: service.name,
    username: user.username,
  });
  return NextResponse.json({ ok: true });
}
