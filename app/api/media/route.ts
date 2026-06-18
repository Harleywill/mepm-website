import { NextResponse } from 'next/server';
import { scanMedia } from '@/lib/media';

/**
 * GET /api/media
 * Public endpoint: lists all uploaded images from projects, team, and testimonials.
 * Returns array of media items with URLs, filenames, stored paths, and collection type.
 */
export async function GET() {
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
