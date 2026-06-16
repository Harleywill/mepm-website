import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

/** Public read — the public site needs phone, socials, stats, qualifications. */
export async function GET() {
  return NextResponse.json(await getSettings());
}

/**
 * Admin: save everything in one call. Updates the settings singleton and
 * replaces the stats + qualifications lists (simple + robust for small lists).
 */
export async function PUT(req: Request) {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const s = body.settings ?? {};
  const stats: Array<{ prefix?: string; value?: number; suffix?: string; label?: string }> =
    Array.isArray(body.stats) ? body.stats : [];
  const qualifications: Array<{ label?: string }> = Array.isArray(
    body.qualifications
  )
    ? body.qualifications
    : [];

  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {
      phone: String(s.phone ?? ''),
      email: String(s.email ?? ''),
      addressLine1: String(s.addressLine1 ?? ''),
      addressLine2: String(s.addressLine2 ?? ''),
      addressLine3: String(s.addressLine3 ?? ''),
      facebook: String(s.facebook ?? ''),
      twitter: String(s.twitter ?? ''),
      instagram: String(s.instagram ?? ''),
      linkedin: String(s.linkedin ?? ''),
    },
    create: {
      id: 'main',
      phone: String(s.phone ?? ''),
      email: String(s.email ?? ''),
      addressLine1: String(s.addressLine1 ?? ''),
      addressLine2: String(s.addressLine2 ?? ''),
      addressLine3: String(s.addressLine3 ?? ''),
      facebook: String(s.facebook ?? ''),
      twitter: String(s.twitter ?? ''),
      instagram: String(s.instagram ?? ''),
      linkedin: String(s.linkedin ?? ''),
    },
  });

  // Replace stats (skip blank labels).
  await prisma.stat.deleteMany({});
  await prisma.stat.createMany({
    data: stats
      .filter((st) => (st.label ?? '').trim())
      .map((st, i) => ({
        prefix: String(st.prefix ?? ''),
        value: Number(st.value) || 0,
        suffix: String(st.suffix ?? ''),
        label: String(st.label).trim(),
        order: i,
      })),
  });

  // Replace qualifications (skip blank labels).
  await prisma.qualification.deleteMany({});
  await prisma.qualification.createMany({
    data: qualifications
      .filter((q) => (q.label ?? '').trim())
      .map((q, i) => ({ label: String(q.label).trim(), order: i })),
  });

  return NextResponse.json(await getSettings());
}
