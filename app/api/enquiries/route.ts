import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import {
  saveUpload,
  deleteUpload,
  validateFiles,
  ENQUIRY_TYPES,
} from '@/lib/uploads';
import { sendEnquiryAlert } from '@/lib/email';
import { isEnquiryStatus } from '@/lib/enquiries';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public: create an enquiry from the contact form (multipart). */
export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const message = String(form.get('message') || '').trim();
  const phone = String(form.get('phone') || '').trim() || null;
  const organisation = String(form.get('organisation') || '').trim() || null;
  const service = String(form.get('service') || '').trim() || null;

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email.';
  if (!message) errors.message = 'A message is required.';
  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const files = form
    .getAll('attachments')
    .filter((f): f is File => f instanceof File && f.size > 0);
  const fileError = validateFiles(files, {
    maxFiles: 6,
    maxSizeMB: 10,
    allowedTypes: ENQUIRY_TYPES,
  });
  if (fileError) {
    return NextResponse.json({ errors: { attachments: fileError } }, { status: 400 });
  }

  const enquiry = await prisma.enquiry.create({
    data: { name, email, phone, organisation, service, message },
  });

  // Save files; on any failure roll the enquiry (and saved files) back so we
  // never leave a half-written record.
  const saved: string[] = [];
  try {
    for (const file of files) {
      const meta = await saveUpload(file, `uploads/enquiries/${enquiry.id}`);
      saved.push(meta.storedPath);
      await prisma.attachment.create({
        data: {
          enquiryId: enquiry.id,
          filename: meta.filename,
          storedPath: meta.storedPath,
          mimeType: meta.mimeType,
          size: meta.size,
        },
      });
    }
  } catch (err) {
    await Promise.all(saved.map(deleteUpload));
    await prisma.enquiry.delete({ where: { id: enquiry.id } }).catch(() => {});
    console.error('[enquiries] file save failed:', err);
    return NextResponse.json(
      { error: 'Could not save your attachments. Please try again.' },
      { status: 500 }
    );
  }

  // Best-effort email; never blocks the saved enquiry.
  await sendEnquiryAlert(
    { name, email, phone, organisation, service, message },
    files.map((f) => f.name)
  );

  return NextResponse.json({ ok: true });
}

/** Admin: list enquiries, optionally filtered by status and a text search. */
export async function GET(req: Request) {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim();

  const where: {
    status?: string;
    OR?: { [k: string]: { contains: string } }[];
  } = {};
  if (status && isEnquiryStatus(status)) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { message: { contains: search } },
    ];
  }

  const enquiries = await prisma.enquiry.findMany({
    where,
    include: { attachments: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ enquiries });
}
