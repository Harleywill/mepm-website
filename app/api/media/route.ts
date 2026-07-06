import { NextResponse } from 'next/server';
import { scanMedia } from '@/lib/media';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/media
 * Admin only: lists all uploaded images from projects, team, and testimonials
 * (includes drafts/unpublished content, so this must not be public).
 * Returns array of media items with URLs, filenames, stored paths, and collection type.
 */
export async function GET() {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const media = await scanMedia();
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error scanning media:', error);
    return NextResponse.json(
      { error: 'Failed to scan media library' },
      { status: 500 }
    );
  }
}
