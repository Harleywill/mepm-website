'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  imageUrl,
  type ProjectDTO,
  type Discipline,
} from '@/lib/projects';

// Discipline colors
const DISC_COLOR: Record<Discipline, string> = {
  ELE: '#0066cc',
  MEC: '#666666',
  ENV: '#00cc00',
};

export default function AdminProjectsPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const statusParam = searchParams.get('status');
    return statusParam === 'Published' || statusParam === 'Draft' ? statusParam : 'All';
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/projects?admin=1')
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  // Get unique sectors for filter
  const sectors = useMemo(() => {
    const unique = new Set<string>();
    projects.forEach((p) => {
      if (p.sector) unique.add(p.sector);
    });
    return Array.from(unique).sort();
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector =
        selectedSector === 'All' || p.sector === selectedSector;

      const matchesStatus = (() => {
        if (selectedStatus === 'All') return true;
        const isPublished = p.status === 'published' || (p.status !== 'draft' && p.published);
        const isDraft = p.status === 'draft' || (p.status !== 'published' && !p.published);
        if (selectedStatus === 'Published') return isPublished;
        if (selectedStatus === 'Draft') return isDraft;
        return true;
      })();

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [projects, searchQuery, selectedSector, selectedStatus]);

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and its images? This cannot be undone.`))
      return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      load();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">Projects</h1>
          <p className="mt-1 text-sm text-slate-600">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <Plus size={17} /> New project
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search projects, clients, locations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
          />
        </div>

        {/* Sector filter */}
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
        >
          <option value="All">All sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
        >
          <option value="All">All status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center mepm-spec text-slate-400">
          Loading…
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-8 py-16 text-center">
          <p className="text-slate-600">No projects match your filters.</p>
          <p className="mepm-spec mt-1 text-slate-400">
            Try clearing the filters or create a new project.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const disciplines = p.disciplines
              .split(',')
              .filter(Boolean) as Discipline[];
            const cover =
              p.images && p.images.length > 0 ? p.images[0] : null;

            return (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}/edit`}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs hover:shadow-sm transition-shadow"
              >
                {/* Hero Image */}
                <div className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl(cover.storedPath)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon
                        size={28}
                        className="mx-auto text-slate-300 mb-1"
                      />
                      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                        No image
                      </p>
                    </div>
                  )}

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {p.sector && (
                      <span className="inline-flex rounded bg-navy-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-white">
                        {p.sector}
                      </span>
                    )}
                  </div>

                  {/* Top-right badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {p.featured && (
                      <span className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-white">
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${
                        p.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="font-semibold text-navy-800 text-base mb-1 line-clamp-2">
                    {p.title}
                  </h3>

                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {p.summary || p.detail}
                  </p>

                  {/* Discipline badges */}
                  {disciplines.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {disciplines.map((d) => (
                        <span
                          key={d}
                          className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded"
                          style={{
                            backgroundColor: (DISC_COLOR[d] || '#888') + '15',
                            color: DISC_COLOR[d] || '#666',
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-mono text-[11px] text-slate-400">
                      {p.location && p.year
                        ? `${p.location} · ${p.year}`
                        : p.location || p.year || '—'}
                    </span>
                    <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/admin/projects/${p.id}/edit`;
                        }}
                        className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirm({ id: p.id, title: p.title });
                        }}
                        className="p-2 rounded-md border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-navy-800 mb-2">
              Delete project?
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              "{deleteConfirm.title}" will be removed from the website along
              with all its images. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(deleteConfirm.id, deleteConfirm.title)}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
