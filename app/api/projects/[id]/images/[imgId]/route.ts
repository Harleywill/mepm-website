import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { deleteUpload } from '@/lib/uploads';

/** Admin: update an image (set cover or caption). Setting cover clears the
 *  cover flag on the project's other images. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; imgId: string }> }
) {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id, imgId } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.isCover === true) {
    await prisma.projectImage.updateMany({
      where: { projectId: id },
      data: { isCover: false },
    });
    await prisma.projectImage.update({
      where: { id: imgId },
      data: { isCover: true },
    });
  }
  if (typeof body.caption === 'string') {
    await prisma.projectImage.update({
      where: { id: imgId },
      data: { caption: body.caption },
    });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json({ project });
}

/** Admin: delete one image (file + row). Promotes another image to cover if
 *  the deleted one was the cover. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imgId: string }> }
) {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id, imgId } = await params;
  const image = await prisma.projectImage.findFirst({
    where: { id: imgId, projectId: id },
  });
  if (!image) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await deleteUpload(image.storedPath);
  await prisma.projectImage.delete({ where: { id: imgId } });

  if (image.isCover) {
    const next = await prisma.projectImage.findFirst({
      where: { projectId: id },
      orderBy: { order: 'asc' },
    });
    if (next)
      await prisma.projectImage.update({
        where: { id: next.id },
        data: { isCover: true },
      });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json({ project });
}
