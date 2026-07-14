'use client';

import { useRef, useState } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Star, X, Check } from 'lucide-react';
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
import FocalPointPicker from './FocalPointPicker';

const DISCIPLINE_COLORS: Record<Discipline, string> = {
  ELE: '#0066cc', // blue
  MEC: '#666666', // grey
  ENV: '#00cc00', // green
};

const SECTOR_OPTIONS = [
  'Commercial',
  'Education',
  'Healthcare',
  'Industrial',
  'Residential',
  'Retail',
];

export default function ProjectForm({ project }: { project?: ProjectDTO }) {
  const router = useRouter();
  const editing = Boolean(project);
  const fileInputGallery = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(project?.title ?? '');
  const [client, setClient] = useState(project?.client ?? '');
  const [location, setLocation] = useState(project?.location ?? '');
  const [sector, setSector] = useState(project?.sector ?? 'Commercial');
  const [disciplines, setDisciplines] = useState<Discipline[]>(
    project ? disciplinesToArray(project.disciplines) : []
  );
  const [status, setStatus] = useState(project?.status ?? 'draft');
  const [year, setYear] = useState(project?.year ? String(project.year) : new Date().getFullYear().toString());
  const [summary, setSummary] = useState(project?.summary ?? '');
  const [detail, setDetail] = useState(project?.detail ?? '');
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [published, setPublished] = useState(project?.published ?? false);
  const [images, setImages] = useState(project?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cover = images.find((img) => img.isCover) ?? null;

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
    year: parseInt(year, 10),
    summary,
    detail,
    featured,
    published: status === 'published',
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

  // Live drag feedback (no network) vs. persisting once the drag ends —
  // keeps the picker responsive without a fetch on every mouse-move.
  const setCropLocal = (imgId: string, cropX: number, cropY: number) => {
    setImages((prev) => prev.map((img) => (img.id === imgId ? { ...img, cropX, cropY } : img)));
  };

  const saveCrop = async (imgId: string, cropX: number, cropY: number) => {
    if (!project) return;
    await fetch(`/api/projects/${project.id}/images/${imgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cropX, cropY }),
    });
  };

  return (
    <form onSubmit={save}>
      {/* Sticky Editor Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/projects')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="mepm-spec text-green-700">{editing ? 'Editing' : 'New project'}</div>
            <h1 className="mt-0.5 font-archivo text-xl font-bold text-navy-800">
              {title || 'Untitled project'}
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/projects')}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* MAIN COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Title & Summary */}
          <Panel>
            <FieldGroup label="Project title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ashworth Science Campus"
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
              />
            </FieldGroup>
            <div className="h-4" />
            <FieldGroup label="Card summary" hint={`${summary.length}/160`}>
              <textarea
                value={summary}
                maxLength={160}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-line description shown on the project card."
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
                style={{ minHeight: 64 }}
              />
            </FieldGroup>
          </Panel>

          {/* Cover Image & Focal Point */}
          <Panel>
            <FieldGroup label="Cover image" hint="Shown on the homepage card & case-study header">
              {cover ? (
                <FocalPointPicker
                  imageUrl={imageUrl(cover.storedPath)}
                  cropX={cover.cropX}
                  cropY={cover.cropY}
                  onChange={(x, y) => setCropLocal(cover.id, x, y)}
                  onChangeEnd={(x, y) => saveCrop(cover.id, x, y)}
                />
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center text-slate-400">
                  <ImageIcon size={28} strokeWidth={1.5} />
                  <div className="mepm-spec max-w-[220px]">
                    {editing
                      ? 'Upload an image below, then set it as cover to control the crop here.'
                      : 'Create the project first, then upload images below.'}
                  </div>
                </div>
              )}
            </FieldGroup>
          </Panel>

          {/* Detail Body */}
          <Panel>
            <FieldGroup label="Case-study body">
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="The full write-up. Lead with the outcome, back it with numbers and standards."
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
                style={{ minHeight: 200 }}
              />
            </FieldGroup>
          </Panel>

          {/* Gallery */}
          {editing && (
            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <span className="mepm-spec text-slate-500">Gallery</span>
                <span className="mepm-body text-sm text-slate-600">
                  {images.length} image{images.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    style={{ height: 110 }}
                  >
                    <NextImage
                      src={imageUrl(img.storedPath)}
                      alt={img.caption ?? ''}
                      width={220}
                      height={110}
                      className="h-full w-full object-cover"
                    />
                    {img.isCover && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-navy-700 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-white">
                        <Star size={9} /> Cover
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => setCover(img.id)}
                          className="rounded bg-white/90 p-1.5 text-navy-700 hover:bg-white"
                          title="Set as cover"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="rounded bg-white/90 p-1.5 text-red-600 hover:bg-white"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputGallery.current?.click()}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                >
                  <Plus size={20} />
                </button>
              </div>
              <input
                ref={fileInputGallery}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="sr-only"
                onChange={(e) => {
                  uploadImages(e.target.files);
                  e.target.value = '';
                }}
              />
            </Panel>
          )}
        </div>

        {/* SIDE COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Status */}
          <Panel>
            <FieldGroup label="Status">
              <div className="flex gap-2">
                {PROJECT_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      status === st
                        ? 'border-navy-600 bg-navy-50 text-navy-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300'
                    }`}
                  >
                    {PROJECT_STATUS_LABELS[st]}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <div className="mt-4 rounded-md border border-green-100 bg-green-50 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mepm-body font-medium text-navy-800">Feature on homepage</div>
                  <div className="mepm-spec mt-1 text-slate-600">Display this project on the homepage</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatured(!featured)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors ${
                    featured
                      ? 'border-green-600 bg-green-600'
                      : 'border-slate-300 bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      featured ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Panel>

          {/* Sector & Disciplines */}
          <Panel>
            <FieldGroup label="Sector">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
              >
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <div className="mt-4">
              <div className="mepm-spec mb-3 text-slate-500">Disciplines</div>
              <div className="flex flex-wrap gap-2">
                {DISCIPLINES.map((d) => {
                  const on = disciplines.includes(d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDiscipline(d)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        on
                          ? 'text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                      style={{
                        backgroundColor: on ? DISCIPLINE_COLORS[d] : undefined,
                        opacity: on ? 1 : 0.7,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* Client, Year, Location */}
          <Panel>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Client">
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Client"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
                />
              </FieldGroup>
              <FieldGroup label="Year">
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2026"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
                />
              </FieldGroup>
            </div>
            <div className="mt-3">
              <FieldGroup label="Location">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
                />
              </FieldGroup>
            </div>
          </Panel>

          {/* Status Badge */}
          <Panel>
            <div className="flex items-center justify-between">
              <span className="mepm-spec text-slate-500">Published</span>
              <button
                type="button"
                onClick={() => setPublished(!published)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors ${
                  published
                    ? 'border-green-600 bg-green-600'
                    : 'border-slate-300 bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Panel>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5.5 shadow-xs">
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label className="mepm-body text-sm font-medium text-navy-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {hint && <span className="mepm-spec text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
