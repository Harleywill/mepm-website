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

/** Public list of all services, sorted by order. */
export async function GET(_req: Request) {
  const services = await prisma.service.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  // Parse points arrays for response
  return NextResponse.json({
    services: services.map((s) => ({
      ...s,
      points: parsePoints(s.points),
    })),
  });
}

/** Admin: create a new service. */
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

  // Validate required fields
  const validationError = validateService(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const code = String(body.code || '').toUpperCase();
  const title = String(body.title || '').trim();
  const desc = String(body.desc || '').trim();

  // Check for duplicate code
  const existing = await prisma.service.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: `Service with code "${code}" already exists` },
      { status: 400 }
    );
  }

  const points = Array.isArray(body.points) ? body.points : [];
  const order = Number(body.order) || 0;

  const service = await prisma.service.create({
    data: {
      code,
      title,
      desc,
      points: stringifyPoints(points),
      statValue: String(body.statValue || ''),
      statLabel: String(body.statLabel || ''),
      order,
    },
  });

  return NextResponse.json(
    {
      service: {
        ...service,
        points: parsePoints(service.points),
      },
    },
    { status: 201 }
  );
}
