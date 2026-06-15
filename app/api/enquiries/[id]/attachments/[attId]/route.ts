import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

/** Admin: stream a private enquiry attachment as a download. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attId: string }> }
) {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id, attId } = await params;
  const attachment = await prisma.attachment.findFirst({
    where: { id: attId, enquiryId: id },
  });
  if (!attachment) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  try {
    const buffer = await readFile(
      path.join(process.cwd(), attachment.storedPath)
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.filename}"`,
        'Content-Length': String(attachment.size),
      },
    });
  } catch {
    return NextResponse.json({ error: 'file missing' }, { status: 404 });
  }
}
