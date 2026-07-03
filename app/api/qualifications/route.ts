import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { revalidatePublicSite } from '@/lib/revalidate';

export async function GET() {
  try {
    const qualifications = await prisma.qualification.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ qualifications });
  } catch (error) {
    console.error('Failed to fetch qualifications:', error);
    return NextResponse.json({ qualifications: [] }, { status: 500 });
  }
}

/** Admin: replace the full qualifications list (same replace-all pattern as /api/site-stats). */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const incoming: Array<{ label?: string }> = Array.isArray(body) ? body : [];

    await prisma.qualification.deleteMany({});
    await prisma.qualification.createMany({
      data: incoming
        .filter((q) => (q.label ?? '').trim())
        .map((q, i) => ({ label: String(q.label).trim(), order: i })),
    });

    const qualifications = await prisma.qualification.findMany({
      orderBy: { order: 'asc' },
    });

    revalidatePublicSite();
    await logActivity({
      action: 'update',
      entityType: 'Qualification',
      entityId: 'bulk',
      entityLabel: `Qualifications updated (${qualifications.length})`,
      username: user.username,
    });

    return NextResponse.json({ ok: true, qualifications });
  } catch (error) {
    console.error('Failed to save qualifications:', error);
    return NextResponse.json({ ok: false, error: 'Failed to save' }, { status: 500 });
  }
}
