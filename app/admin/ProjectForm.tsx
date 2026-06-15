'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Trash2, UploadCloud } from 'lucide-react';
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  disciplinesToArray,
  imageUrl,
  type Discipline,
  type ProjectDTO,
} from '@/lib/projects';

const input =
  'w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60 focus:border-navy-300 transition-colors';
const label = 'mb-1.5 block text-sm font-medium text-navy-700';

export default function ProjectForm({ project }: { project?: ProjectDTO }) {
  const router = useRouter();
  const editing = Boolean(project);
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(project?.title ?? '');
  const [client, setClient] = useState(project?.client ?? '');
  const [location, setLocation] = useState(project?.location ?? '');
  const [sector, setSector] = useState(project?.sector ?? '');
  const [disciplines, setDisciplines] = useState<Discipline[]>(
    project ? disciplinesToArray(project.disciplines) : []
  );
  const [status, setStatus] = useState(project?.status ?? 'complete');
  const [year, setYear] = useState(project?.year ? String(project.year) : '');
  const [summary, setSummary] = useState(project?.summary ?? '');
  const [detail, setDetail] = useState(project?.detail ?? '');
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [published, setPublished] = useState(project?.published ?? false);
  const [images, setImages] = useState(project?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleDiscipline = (d: Discipline) =>
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const payload = () => ({
    title,
    client,
    location,
    sector,
    disciplines,
    status,
    year,
    summary,
    detail,
    featured,
    published,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing && project) {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        });
        if (!res.ok) throw new Error();
        router.push('/admin/projects');
        router.refresh();
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Go to edit so the user can add drawings to the new project.
        router.push(`/admin/projects/${data.project.id}/edit`);
      }
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || !project) return;
    const data = new FormData();
    Array.from(files).forEach((f) => data.append('images', f));
    const res = await fetch(`/api/projects/${project.id}/images`, {
      method: 'POST',
      body: data,
    });
    if (res.ok) setImages((await res.json()).project.images);
  };

  const setCover = async (imgId: string) => {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}/images/${imgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCover: true }),
    });
    if (res.ok) setImages((await res.json()).project.images);
  };

  const removeImage = async (imgId: string) => {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}/images/${imgId}`, {
      method: 'DELETE',
    });
    if (res.ok) setImages((await res.json()).project.images);
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={label}>
            Title <span className="text-danger">*</span>
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={input}
            placeholder="Ashworth Science Campus"
          />
        </div>
        <div>
          <label htmlFor="client" className={label}>
            Client
          </label>
          <input id="client" value={client} onChange={(e) => setClient(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="location" className={label}>
            Location
          </label>
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="sector" className={label}>
            Sector
          </label>
          <input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} className={input} placeholder="Education" />
        </div>
        <div>
          <label htmlFor="year" className={label}>
            Year
          </label>
          <input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className={input} placeholder="2026" />
        </div>
      </div>

      <div>
        <span className={label}>Disciplines</span>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map((d) => {
            const on = disciplines.includes(d);
            return (
              <button
                type="button"
                key={d}
                onClick={() => toggleDiscipline(d)}
                aria-pressed={on}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  on
                    ? 'border-navy-700 bg-navy-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300'
                }`}
              >
                {d} · {DISCIPLINE_LABELS[d]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={label}>
            Status
          </label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="summary" className={label}>
          Summary
        </label>
        <textarea id="summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} className={input} placeholder="One or two lines shown on the projects index." />
      </div>
      <div>
        <label htmlFor="detail" className={label}>
          Detail
        </label>
        <textarea id="detail" rows={6} value={detail} onChange={(e) => setDetail(e.target.value)} className={input} placeholder="The full write-up shown on the project page." />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-green-600" />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-green-600" />
          Published (live on site)
        </label>
      </div>

      {/* Images — only after the project exists */}
      {editing && (
        <div className="border-t border-slate-200 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className={label + ' mb-0'}>Drawings & photos</span>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3.5 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              <UploadCloud size={16} /> Add images
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="sr-only"
              onChange={(e) => {
                uploadImages(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          {images.length === 0 ? (
            <p className="mepm-spec text-slate-400">
              No images yet. The first you add becomes the cover.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(img.storedPath)}
                    alt={img.caption ?? ''}
                    className="h-32 w-full object-cover"
                  />
                  {img.isCover && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-navy-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-white">
                      <Star size={10} /> Cover
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-white/90 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {!img.isCover && (
                      <button
                        type="button"
                        onClick={() => setCover(img.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50"
                      >
                        Set cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="ml-auto rounded p-1 text-danger hover:bg-danger/5"
                      aria-label="Remove image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md bg-green-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/projects')}
          className="rounded-md border border-slate-200 px-6 py-3 text-base font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
