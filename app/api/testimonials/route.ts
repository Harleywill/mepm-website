import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateTestimonial } from '@/lib/testimonials';
import { validateFiles, saveUpload, IMAGE_DOC_TYPES } from '@/lib/uploads';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import type { Role } from '@/lib/roles';

/** Public list of all testimonials. */
export async function GET(_req: Request) {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ testimonials });
}

/** Admin: create a testimonial with optional logo upload. */
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

  const formData = await req.formData();

  // Extract text fields
  const quote = String(formData.get('quote') || '').trim();
  const author = String(formData.get('author') || '').trim();
  const company = String(formData.get('company') || '').trim() || null;
  const order = Number(formData.get('order')) || 0;

  // Validate required fields
  if (!quote) {
    return NextResponse.json({ error: 'Quote is required' }, { status: 400 });
  }
  if (!author) {
    return NextResponse.json({ error: 'Author is required' }, { status: 400 });
  }

  // Check for duplicate author
  const existing = await prisma.testimonial.findUnique({ where: { author } });
  if (existing) {
    return NextResponse.json(
      { error: 'A testimonial with this author already exists' },
      { status: 400 }
    );
  }

  // Handle optional logo upload
  let logoPath: string | null = null;
  const logoFile = formData.get('logo');
  if (logoFile instanceof File) {
    const validateErr = validateFiles([logoFile], {
      maxFiles: 1,
      maxSizeMB: 5,
      allowedTypes: IMAGE_DOC_TYPES.filter((t) => t.startsWith('image/')),
    });
    if (validateErr) {
      return NextResponse.json({ error: validateErr }, { status: 400 });
    }

    const saved = await saveUpload(logoFile, 'public/uploads/testimonials');
    logoPath = saved.storedPath;
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      quote,
      author,
      company,
      logo: logoPath,
      order,
    },
  });

  revalidatePublicSite();
  await logActivity({
    action: 'create',
    entityType: 'Testimonial',
    entityId: testimonial.id,
    entityLabel: testimonial.author,
    username: user.username,
  });
  return NextResponse.json({ testimonial }, { status: 201 });
}
