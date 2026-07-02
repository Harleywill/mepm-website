import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { getServiceOfferings, validateServiceOffering, stringifyJsonArray, slugify } from '@/lib/services';
import { logActivity } from '@/lib/activity';
import type { Role } from '@/lib/roles';

/** Public list of all service offerings, sorted by order. */
export async function GET(_req: Request) {
  const offerings = await getServiceOfferings();
  return NextResponse.json({ offerings });
}

/** Admin: create a new service offering. */
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

  const validationError = validateServiceOffering(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const base = slugify(String(body.name || ''));
  let slug = base;
  let suffix = 2;
  while (await prisma.serviceOffering.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  const offering = await prisma.serviceOffering.create({
    data: {
      slug,
      name: String(body.name || '').trim(),
      shortDescription: String(body.shortDescription || '').trim(),
      description: String(body.description || '').trim(),
      keywords: stringifyJsonArray(body.keywords || []),
      order: Number(body.order) || 0,
    },
  });

  await logActivity({
    action: 'create',
    entityType: 'ServiceOffering',
    entityId: offering.id,
    entityLabel: offering.name,
    username: user.username,
  });
  return NextResponse.json({ offering }, { status: 201 });
}
