import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import {
  validateService,
  parsePoints,
  stringifyPoints,
  isValidServiceCode,
} from '@/lib/services';
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

  return NextResponse.json({
    service: {
      ...service,
      points: parsePoints(service.points),
    },
  });
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

  // Partial updates: only include fields that were provided
  const data: Record<string, unknown> = {};

  if ('code' in body) {
    const code = String(body.code || '').toUpperCase();
    if (!isValidServiceCode(code)) {
      return NextResponse.json(
        { error: 'Code must be ELE, MEC, or ENV' },
        { status: 400 }
      );
    }
    data.code = code;
  }

  if ('title' in body) {
    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    data.title = title;
  }

  if ('desc' in body) {
    const desc = String(body.desc || '').trim();
    if (!desc) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }
    data.desc = desc;
  }

  if ('points' in body) {
    const points = Array.isArray(body.points) ? body.points : [];
    data.points = stringifyPoints(points);
  }

  if ('statValue' in body) {
    data.statValue = String(body.statValue || '');
  }

  if ('statLabel' in body) {
    data.statLabel = String(body.statLabel || '');
  }

  if ('order' in body) {
    data.order = Number(body.order) || 0;
  }

  // Check for code uniqueness if code is being changed
  if ('code' in data) {
    const existing = await prisma.service.findUnique({
      where: { code: data.code as string },
    });
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: `Service with code "${data.code}" already exists` },
        { status: 400 }
      );
    }
  }

  const service = await prisma.service.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    service: {
      ...service,
      points: parsePoints(service.points),
    },
  });
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
  return NextResponse.json({ ok: true });
}
