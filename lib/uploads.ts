import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface SavedFile {
  filename: string; // original name, shown to admins
  storedPath: string; // path relative to repo root
  mimeType: string;
  size: number;
}

export const IMAGE_DOC_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const CAD_EXTS = ['.dwg', '.dxf', '.rvt'];
const OFFICE_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export interface ValidateOptions {
  maxFiles?: number;
  maxSizeMB?: number;
  /** Allowed MIME types. CAD files (no reliable MIME) pass by extension. */
  allowedTypes?: string[];
}

/** Returns an error string, or null if all files are acceptable. */
export function validateFiles(
  files: File[],
  { maxFiles = 6, maxSizeMB = 10, allowedTypes }: ValidateOptions = {}
): string | null {
  if (files.length > maxFiles) return `Up to ${maxFiles} files.`;
  for (const file of files) {
    if (file.size > maxSizeMB * 1024 * 1024)
      return `${file.name} is over ${maxSizeMB} MB.`;
    if (allowedTypes) {
      const ext = path.extname(file.name).toLowerCase();
      const ok = allowedTypes.includes(file.type) || CAD_EXTS.includes(ext);
      if (!ok) return `${file.name} is not an accepted file type.`;
    }
  }
  return null;
}

export const ENQUIRY_TYPES = [...IMAGE_DOC_TYPES, ...OFFICE_TYPES];

/**
 * Write an uploaded File to `destDirRel` (relative to repo root, e.g.
 * "uploads/enquiries/<id>" or "public/uploads/projects/<id>"). Returns the
 * stored metadata. The on-disk name is randomised; the original is preserved
 * in `filename`.
 */
export async function saveUpload(
  file: File,
  destDirRel: string
): Promise<SavedFile> {
  const absDir = path.join(process.cwd(), destDirRel);
  await mkdir(absDir, { recursive: true });
  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const storedPathRel = path.join(destDirRel, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), storedPathRel), buffer);
  return {
    filename: file.name,
    storedPath: storedPathRel,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };
}

/** Delete a stored file by its repo-relative path. Ignores missing files. */
export async function deleteUpload(storedPathRel: string): Promise<void> {
  try {
    await unlink(path.join(process.cwd(), storedPathRel));
  } catch {
    // already gone — nothing to do
  }
}

/** Map a ProjectImage.storedPath (under public/) to its public URL. */
export function publicUrlFor(storedPathRel: string): string {
  return '/' + storedPathRel.replace(/^public\//, '');
}
