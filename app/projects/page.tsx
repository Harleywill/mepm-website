import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import {
  disciplinesToArray,
  isProjectStatus,
  PROJECT_STATUS_LABELS,
} from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Projects — MEPM Building Services Consultants',
  description:
    'Selected electrical, mechanical and environmental engineering projects by MEPM.',
};

// Always reflect the latest published projects.
export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <>
      <section className="bp-grid-light border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-14">
          <span className="mepm-spec text-green-700">MEPM · Drawing register</span>
          <h1 className="mepm-display mt-4 text-navy-700">
            Projects
          </h1>
          <p className="mepm-lead mt-5 max-w-xl">
            A selection of the electrical, mechanical and environmental
            engineering we have delivered.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-20 text-center">
            <p className="text-slate-600">Projects are being added soon.</p>
            <p className="mepm-spec mt-1 text-slate-400">
              Check back shortly, or get in touch to discuss your project.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="hidden border-b border-slate-200 px-5 py-3 text-slate-500 md:grid md:grid-cols-[88px_1fr_160px_120px_120px] md:gap-4">
              {['Sheet', 'Project', 'Sector', 'Disciplines', 'Year'].map((h) => (
                <span
                  key={h}
                  className="font-mono text-[11px] uppercase tracking-[0.06em]"
                >
                  {h}
                </span>
              ))}
            </div>
            {projects.map((p, i) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="grid grid-cols-1 gap-1 border-b border-slate-100 px-5 py-5 transition-colors last:border-0 hover:bg-slate-50 md:grid-cols-[88px_1fr_160px_120px_120px] md:items-center md:gap-4"
              >
                <span className="font-mono text-sm font-semibold text-green-700">
                  PRJ-{String(i + 1).padStart(3, '0')}
                </span>
                <span>
                  <span className="block font-body font-semibold text-navy-700">
                    {p.title}
                  </span>
                  {p.location && (
                    <span className="block text-sm text-slate-500">
                      {p.location}
                    </span>
                  )}
                </span>
                <span className="text-sm text-slate-600">{p.sector || '—'}</span>
                <span className="font-mono text-xs text-slate-500">
                  {disciplinesToArray(p.disciplines).join(' · ') || '—'}
                </span>
                <span className="text-sm text-slate-600">
                  {p.year || (isProjectStatus(p.status)
                    ? PROJECT_STATUS_LABELS[p.status]
                    : '')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
