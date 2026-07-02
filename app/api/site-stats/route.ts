import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const stats = await prisma.stat.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const stats = body.stats || [];

    // Delete all existing stats and create new ones
    await prisma.stat.deleteMany({});

    const created = await Promise.all(
      stats.map((s: any, idx: number) =>
        prisma.stat.create({
          data: {
            prefix: String(s.prefix || ''),
            value: Number(s.value || 0),
            suffix: String(s.suffix || ''),
            label: String(s.label || ''),
            order: idx,
          },
        })
      )
    );

    await logActivity({
      action: 'update',
      entityType: 'Stat',
      entityId: 'bulk',
      entityLabel: `Site stats updated (${created.length})`,
      username: user.username,
    });

    return NextResponse.json({ stats: created });
  } catch (error) {
    console.error('Failed to save stats:', error);
    return NextResponse.json({ error: 'Failed to save stats' }, { status: 500 });
  }
}
