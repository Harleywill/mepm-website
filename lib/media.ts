import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export interface MediaItem {
  url: string; // public URL
  filename: string; // file name only (e.g., "uuid.jpg")
  storedPath: string; // full repo-relative path (e.g., "public/uploads/projects/.../uuid.jpg")
  collection: 'projects' | 'team' | 'testimonials'; // source collection
}

/**
 * Scan public/uploads/ directories for media files.
 * Returns all images from projects, team, and testimonials collections.
 */
export async function scanMedia(): Promise<MediaItem[]> {
  const media: MediaItem[] = [];
  const collections: Array<'projects' | 'team' | 'testimonials'> = [
    'projects',
    'team',
    'testimonials',
  ];

  for (const collection of collections) {
    const collectionPath = path.join(
      process.cwd(),
      'public/uploads',
      collection
    );

    try {
      // Read collection directory (e.g., public/uploads/projects/)
      const dirs = await readdir(collectionPath);

      for (const dir of dirs) {
        const dirPath = path.join(collectionPath, dir);
        const dirStat = await stat(dirPath);

        if (!dirStat.isDirectory()) continue;

        // Read files within each subdirectory
        const files = await readdir(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const fileStat = await stat(filePath);

          if (!fileStat.isFile()) continue;

          // Build relative path from repo root
          const storedPath = path.relative(process.cwd(), filePath);

          // Convert to public URL
          const url = '/' + storedPath.replace(/^public\//, '');

          media.push({
            url,
            filename: file,
            storedPath,
            collection,
          });
        }
      }
    } catch (error) {
      // Collection directory doesn't exist or can't be read
      // This is expected on fresh installs
      continue;
    }
  }

  return media;
}
