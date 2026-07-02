import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });
    const qualifications = settings?.qualifications || [];
    return NextResponse.json({ qualifications });
  } catch (error) {
    console.error('Failed to fetch qualifications:', error);
    return NextResponse.json({ qualifications: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const qualifications = await request.json();

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: { qualifications },
      create: { id: 'main', qualifications },
    });

    return NextResponse.json({
      ok: true,
      qualifications: updated.qualifications || [],
    });
  } catch (error) {
    console.error('Failed to save qualifications:', error);
    return NextResponse.json({ ok: false, error: 'Failed to save' }, { status: 500 });
  }
}
