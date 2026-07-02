import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateFiles, saveUpload, deleteUpload, IMAGE_DOC_TYPES } from '@/lib/uploads';
import { logActivity } from '@/lib/activity';
import type { Role } from '@/lib/roles';

/** Admin: get one testimonial. */
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
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ testimonial });
}

/** Admin: update a testimonial with optional logo upload. */
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
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const formData = await req.formData();

  // Build update object from provided fields
  const data: Record<string, unknown> = {};

  if (formData.has('quote')) {
    const quote = String(formData.get('quote') || '').trim();
    if (!quote) {
      return NextResponse.json({ error: 'Quote cannot be empty' }, { status: 400 });
    }
    data.quote = quote;
  }

  if (formData.has('author')) {
    const author = String(formData.get('author') || '').trim();
    if (!author) {
      return NextResponse.json({ error: 'Author cannot be empty' }, { status: 400 });
    }
    // Check uniqueness (excluding current testimonial)
    const conflict = await prisma.testimonial.findUnique({ where: { author } });
    if (conflict && conflict.id !== id) {
      return NextResponse.json(
        { error: 'A testimonial with this author already exists' },
        { status: 400 }
      );
    }
    data.author = author;
  }

  if (formData.has('company')) {
    const company = String(formData.get('company') || '').trim() || null;
    data.company = company;
  }

  if (formData.has('order')) {
    data.order = Number(formData.get('order')) || 0;
  }

  // Handle optional logo upload
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

    // Delete old logo if it exists
    if (testimonial.logo) {
      await deleteUpload(testimonial.logo);
    }

    const saved = await saveUpload(logoFile, 'public/uploads/testimonials');
    data.logo = saved.storedPath;
  }

  // Only update if there are changes
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ testimonial });
  }

  const updated = await prisma.testimonial.update({
    where: { id },
    data,
  });

  await logActivity({
    action: 'update',
    entityType: 'Testimonial',
    entityId: updated.id,
    entityLabel: updated.author,
    username: user.username,
  });

  return NextResponse.json({ testimonial: updated });
}

/** Admin: delete a testimonial and remove logo if exists. */
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
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Delete logo if it exists
  if (testimonial.logo) {
    await deleteUpload(testimonial.logo);
  }

  await prisma.testimonial.delete({ where: { id } });
  await logActivity({
    action: 'delete',
    entityType: 'Testimonial',
    entityId: testimonial.id,
    entityLabel: testimonial.author,
    username: user.username,
  });
  return NextResponse.json({ ok: true });
}
