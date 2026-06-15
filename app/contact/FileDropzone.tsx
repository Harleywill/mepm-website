'use client';

import { useEffect, useRef, useState } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon, File } from 'lucide-react';

export const MAX_FILES = 6;
export const MAX_SIZE_MB = 10;
const ACCEPT =
  'image/*,.pdf,.doc,.docx,.dwg,.dxf,.rvt,.xls,.xlsx';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

interface FileDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export default function FileDropzone({ files, onChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reject, setReject] = useState('');
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // Object URLs for image thumbnails, keyed by a stable file signature.
  // Rebuilt whenever the file list changes; revoked on cleanup so we
  // never leak blob URLs.
  useEffect(() => {
    const map: Record<string, string> = {};
    files.forEach((f) => {
      if (isImage(f)) map[fileKey(f)] = URL.createObjectURL(f);
    });
    setPreviews(map);
    return () => {
      Object.values(map).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const next = [...files];
    const errors: string[] = [];

    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_FILES) {
        errors.push(`Up to ${MAX_FILES} files.`);
        break;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name} is over ${MAX_SIZE_MB} MB.`);
        continue;
      }
      const dup = next.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (dup) continue;
      next.push(file);
    }

    setReject(errors[0] ?? '');
    onChange(next);
  };

  const removeAt = (index: number) => {
    setReject('');
    onChange(files.filter((_, i) => i !== index));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Add files: drag and drop, or activate to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-green-500 bg-green-50'
            : 'border-slate-300 bg-slate-50 hover:border-navy-300 hover:bg-navy-50/40'
        }`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            dragging ? 'bg-green-100 text-green-700' : 'bg-white text-navy-700'
          }`}
        >
          <UploadCloud size={22} strokeWidth={1.75} />
        </span>
        <span className="text-sm font-medium text-navy-700">
          Drop files here, or{' '}
          <span className="text-green-700 underline underline-offset-2">
            browse
          </span>
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-slate-500">
          Drawings · PDFs · Photos — up to {MAX_FILES} files, {MAX_SIZE_MB} MB each
        </span>
        <input
          ref={inputRef}
          type="file"
          name="attachments"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            // Reset so picking the same file again re-fires onChange
            e.target.value = '';
          }}
        />
      </div>

      {reject && <p className="mt-2 text-sm text-danger">{reject}</p>}

      {/* Selected files */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => (
            <li
              key={fileKey(file)}
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded bg-slate-100 text-slate-500">
                {previews[fileKey(file)] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[fileKey(file)]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileGlyph file={file} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy-700">
                  {file.name}
                </span>
                <span className="block font-mono text-[11px] text-slate-500">
                  {formatSize(file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${file.name}`}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-danger transition-colors"
              >
                <X size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileGlyph({ file }: { file: File }) {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return <FileText size={19} strokeWidth={1.75} />;
  }
  if (isImage(file)) return <ImageIcon size={19} strokeWidth={1.75} />;
  return <File size={19} strokeWidth={1.75} />;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
