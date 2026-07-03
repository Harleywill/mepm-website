import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, verifyAuthWithUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';
import { deleteUpload } from '@/lib/uploads';
import { isEnquiryStatus } from '@/lib/enquiries';

async function requireAuth() {
  await verifyAuth();
}

/** Admin: fetch one enquiry with its attachments. */
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
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!enquiry) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ enquiry });
}

/** Admin: update status. */
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
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || '');
  if (!isEnquiryStatus(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }
  const enquiry = await prisma.enquiry.update({
    where: { id },
    data: { status },
  });
  revalidatePublicSite();
  await logActivity({
    action: 'update',
    entityType: 'Enquiry',
    entityId: enquiry.id,
    entityLabel: `${enquiry.name} — marked ${status}`,
    username: user.username,
  });
  return NextResponse.json({ enquiry });
}

/** Admin: delete an enquiry and its attachment files. */
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
  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!enquiry) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await Promise.all(enquiry.attachments.map((a) => deleteUpload(a.storedPath)));
  await prisma.enquiry.delete({ where: { id } });
  revalidatePublicSite();
  await logActivity({
    action: 'delete',
    entityType: 'Enquiry',
    entityId: enquiry.id,
    entityLabel: enquiry.name,
    username: user.username,
  });
  return NextResponse.json({ ok: true });
}
