'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import {
  PROJECT_STATUS_LABELS,
  isProjectStatus,
  type ProjectDTO,
} from '@/lib/projects';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);

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

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and its images? This cannot be undone.`))
      return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h1 className="mepm-h2 text-navy-700">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <Plus size={17} /> New project
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="px-6 py-16 text-center mepm-spec text-slate-400">
            Loading…
          </div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-slate-600">No projects yet.</p>
            <p className="mepm-spec mt-1 text-slate-400">
              Create one to publish it to the projects page.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                {['Title', 'Sector', 'Status', 'State', ''].map((h, i) => (
                  <th
                    key={i}
                    className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.06em]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/projects/${p.id}/edit`}
                      className="inline-flex items-center gap-2 font-medium text-navy-700 hover:text-green-600"
                    >
                      {p.featured && (
                        <Star size={13} className="text-green-600" />
                      )}
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{p.sector || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {isProjectStatus(p.status)
                      ? PROJECT_STATUS_LABELS[p.status]
                      : p.status}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] ${
                        p.published
                          ? 'border-green-200 bg-green-100 text-green-800'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/projects/${p.id}/edit`}
                        className="rounded-md p-2 text-slate-500 hover:bg-navy-50 hover:text-navy-700"
                        aria-label={`Edit ${p.title}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => remove(p.id, p.title)}
                        className="rounded-md p-2 text-slate-400 hover:bg-danger/5 hover:text-danger"
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
