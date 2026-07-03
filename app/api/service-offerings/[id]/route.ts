import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { stringifyJsonArray } from '@/lib/services';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import type { Role } from '@/lib/roles';

async function requireAuth() {
  return verifyAuthWithUser();
}

/** Admin: fetch one offering by id. */
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
  const offering = await prisma.serviceOffering.findUnique({ where: { id } });

  if (!offering) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ offering });
}

/** Admin: update an offering (partial updates allowed). */
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
  if ('shortDescription' in body) {
    const shortDescription = String(body.shortDescription || '').trim();
    if (!shortDescription) return NextResponse.json({ error: 'Short description is required' }, { status: 400 });
    data.shortDescription = shortDescription;
  }
  if ('description' in body) data.description = String(body.description || '').trim();
  if ('keywords' in body) data.keywords = stringifyJsonArray(body.keywords || []);
  if ('order' in body) data.order = Number(body.order) || 0;

  if ('slug' in data) {
    const existing = await prisma.serviceOffering.findUnique({ where: { slug: data.slug as string } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Offering with slug "${data.slug}" already exists` }, { status: 400 });
    }
  }

  const offering = await prisma.serviceOffering.update({ where: { id }, data });
  revalidatePublicSite();
  await logActivity({
    action: 'update',
    entityType: 'ServiceOffering',
    entityId: offering.id,
    entityLabel: offering.name,
    username: user.username,
  });
  return NextResponse.json({ offering });
}

/** Admin: delete an offering. */
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
  const offering = await prisma.serviceOffering.findUnique({ where: { id } });

  if (!offering) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await prisma.serviceOffering.delete({ where: { id } });
  revalidatePublicSite();
  await logActivity({
    action: 'delete',
    entityType: 'ServiceOffering',
    entityId: offering.id,
    entityLabel: offering.name,
    username: user.username,
  });
  return NextResponse.json({ ok: true });
}
