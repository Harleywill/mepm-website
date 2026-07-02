import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, verifyAuthWithUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import {
  slugify,
  disciplinesFromArray,
  isProjectStatus,
} from '@/lib/projects';

async function isAdmin(): Promise<boolean> {
  try {
    await verifyAuth();
    return true;
  } catch {
    return false;
  }
}

/** Public list = published only. Admin (authed) gets everything. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wantAll = searchParams.get('admin') === '1';
  const admin = await isAdmin();

  const projects = await prisma.project.findMany({
    where: wantAll && admin ? {} : { published: true },
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ projects });
}

/** Admin: create a project. */
export async function POST(req: Request) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Unique slug: base from title, suffix -2, -3… on collision.
  const base = slugify(title) || 'project';
  let slug = base;
  let n = 2;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }

  const status = isProjectStatus(String(body.status)) ? body.status : 'draft';

  const project = await prisma.project.create({
    data: {
      slug,
      title,
      client: body.client?.trim() || null,
      location: body.location?.trim() || null,
      sector: body.sector?.trim() || null,
      disciplines: disciplinesFromArray(body.disciplines ?? []),
      status,
      year: body.year ? Number(body.year) : null,
      summary: String(body.summary || ''),
      detail: String(body.detail || ''),
      featured: Boolean(body.featured),
      published: Boolean(body.published),
    },
    include: { images: true },
  });
  await logActivity({
    action: 'create',
    entityType: 'Project',
    entityId: project.id,
    entityLabel: project.title,
    username: user.username,
  });
  return NextResponse.json({ project });
}
