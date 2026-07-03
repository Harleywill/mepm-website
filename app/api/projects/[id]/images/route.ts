import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import { saveUpload, validateFiles, IMAGE_DOC_TYPES } from '@/lib/uploads';

/** Admin: upload one or more images to a project. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const form = await req.formData();
  const files = form
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0);

  const error = validateFiles(files, {
    maxFiles: 12,
    maxSizeMB: 10,
    allowedTypes: IMAGE_DOC_TYPES,
  });
  if (error) return NextResponse.json({ error }, { status: 400 });

  let nextOrder = project.images.length;
  let hasCover = project.images.some((i) => i.isCover);

  for (const file of files) {
    const meta = await saveUpload(file, `public/uploads/projects/${id}`);
    await prisma.projectImage.create({
      data: {
        projectId: id,
        filename: meta.filename,
        storedPath: meta.storedPath,
        mimeType: meta.mimeType,
        size: meta.size,
        isCover: !hasCover, // first image overall becomes the cover
        order: nextOrder++,
      },
    });
    hasCover = true;
  }

  const updated = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  if (files.length > 0) {
    revalidatePublicSite();
    await logActivity({
      action: 'update',
      entityType: 'Project',
      entityId: id,
      entityLabel: `${project.title} — ${files.length} image${files.length === 1 ? '' : 's'} added`,
      username: user.username,
    });
  }
  return NextResponse.json({ project: updated });
}
