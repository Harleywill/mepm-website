import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/** Lightweight check the admin client guard polls to confirm a valid session. */
export async function GET() {
  try {
    const payload = await verifyAuth();
    return NextResponse.json({
      ok: true,
      username: payload.sub,
      role: payload.role || 'viewer',
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
