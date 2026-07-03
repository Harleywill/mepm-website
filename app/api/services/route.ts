import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { getServices, validateService, stringifyJsonArray, slugify } from '@/lib/services';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import type { Role } from '@/lib/roles';

/** Public list = published only. Admin (?admin=1) gets everything, including drafts. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const admin = searchParams.get('admin') === '1';
  const services = await getServices(!admin);
  return NextResponse.json({ services });
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

  const validationError = validateService(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const code = String(body.code || '').toUpperCase();

  const existingCode = await prisma.service.findUnique({ where: { code } });
  if (existingCode) {
    return NextResponse.json({ error: `Service with code "${code}" already exists` }, { status: 400 });
  }

  // The admin form never sends a slug (it's auto-generated and not exposed for editing),
  // but the API still accepts an explicit one for programmatic callers.
  const explicitSlug = String(body.slug || '').trim();
  let slug = explicitSlug || slugify(String(body.name || ''));
  if (explicitSlug) {
    const existingSlug = await prisma.service.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: `Service with slug "${slug}" already exists` }, { status: 400 });
    }
  } else {
    const base = slug;
    let suffix = 2;
    while (await prisma.service.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  const service = await prisma.service.create({
    data: {
      slug,
      code,
      name: String(body.name || '').trim(),
      navLabel: String(body.navLabel || '').trim(),
      shortDescription: String(body.shortDescription || '').trim(),
      intro: String(body.intro || '').trim(),
      keywords: stringifyJsonArray(body.keywords || []),
      scope: stringifyJsonArray(body.scope || []),
      deliverables: stringifyJsonArray(body.deliverables || []),
      sustainability: String(body.sustainability || ''),
      relatedSlugs: stringifyJsonArray(body.relatedSlugs || []),
      statValue: String(body.statValue || ''),
      statLabel: String(body.statLabel || ''),
      order: Number(body.order) || 0,
      published: Boolean(body.published),
      icon: String(body.icon || 'Zap'),
    },
  });

  revalidatePublicSite();
  await logActivity({
    action: 'create',
    entityType: 'Service',
    entityId: service.id,
    entityLabel: service.name,
    username: user.username,
  });
  return NextResponse.json({ service }, { status: 201 });
}
