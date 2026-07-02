'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowLeft } from 'lucide-react';
import type { ProjectDTO } from '@/lib/projects';
import type { TeamMemberDTO } from '@/lib/team';
import type { SiteSettingsDTO, StatDTO } from '@/lib/settings';

interface ServiceData {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  icon?: string;
  statValue?: string;
  statLabel?: string;
}

interface TestimonialData {
  id: string;
  quote: string;
  author: string;
  company?: string | null;
}

interface PreviewData {
  projects: ProjectDTO[];
  services: ServiceData[];
  team: TeamMemberDTO[];
  testimonials: TestimonialData[];
  settings: SiteSettingsDTO;
  stats: StatDTO[];
  accreditations: string[];
}

const ACCENT = '#68b830'; // green-600

export default function PreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          projectsRes,
          servicesRes,
          teamRes,
          testimonialsRes,
          settingsRes,
          accreditationsRes,
        ] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/services'),
          fetch('/api/team'),
          fetch('/api/testimonials'),
          fetch('/api/settings'),
          fetch('/api/accreditations'),
        ]);

        const projectsData = await projectsRes.json();
        const servicesData = await servicesRes.json();
        const teamData = await teamRes.json();
        const testimonialsData = await testimonialsRes.json();
        const settingsData = await settingsRes.json();
        const accreditationsData = await accreditationsRes.json();

        setData({
          projects: Array.isArray(projectsData)
            ? projectsData.filter((p: any) => p.published)
            : projectsData.projects?.filter((p: any) => p.published) || [],
          services: Array.isArray(servicesData)
            ? servicesData
            : servicesData.services || [],
          team: Array.isArray(teamData) ? teamData : teamData.team || [],
          testimonials: Array.isArray(testimonialsData)
            ? testimonialsData
            : testimonialsData.testimonials || [],
          settings: settingsData.settings || {},
          stats: settingsData.stats || [],
          accreditations: Array.isArray(accreditationsData)
            ? accreditationsData.map((a: any) => a.label)
            : accreditationsData.accreditations || [],
        });
      } catch (error) {
        console.error('Failed to load preview data:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="font-mono text-slate-400">Loading preview…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="font-mono text-slate-400">Failed to load preview</p>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <CaseStudyPreview
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  const published = data.projects.filter((p) => p.published);
  const featured = published.filter((p) => p.featured).slice(0, 3);
  const grid = featured.length > 0 ? featured : published.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Preview chrome */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-navy-950 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-white/60">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Live site preview · mepm.co.uk
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
          >
            <X size={16} /> Close preview
          </Link>
        </div>
      </div>

      {/* Mini header */}
      <header className="sticky top-14 z-30 border-b border-slate-200 bg-white/94 px-10 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-navy-700">MEPM</div>
          <nav className="flex gap-8 font-body text-sm font-medium text-slate-700">
            {['Home', 'Services', 'Projects', 'About', 'Contact'].map((l) => (
              <span
                key={l}
                className={l === 'Projects' ? 'text-navy-700' : 'text-slate-600'}
              >
                {l}
              </span>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 px-10 py-20 text-white">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 80% 30%, rgba(104, 184, 48, 0.18), transparent 50%)`,
          }}
        />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-green-400">
            <span className="block h-0.5 w-6 bg-green-400" />
            Building Services Consultants
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-white">
            Engineering buildings that <span className="text-green-500">perform.</span>
          </h1>
        </div>
      </section>

      {/* Accreditations marquee */}
      <div className="bg-navy-800 py-3">
        <div className="flex flex-wrap justify-center gap-0 px-10">
          {data.accreditations.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-6 py-1 font-mono text-xs uppercase tracking-widest text-white/60"
            >
              <span className="inline-block h-1 w-1 rounded-full bg-green-500" />
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <section className="relative overflow-hidden bg-navy-700 px-10 py-16 text-white">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 88% 12%, rgba(104, 184, 48, 0.2), transparent 45%)`,
          }}
        />
        <div className="relative mx-auto grid max-w-4xl grid-cols-4 gap-8">
          {data.stats.map((st) => (
            <div key={st.id} className="border-l-2 border-green-500 pl-4">
              <div className="font-display text-4xl font-extrabold leading-tight tracking-tighter">
                {st.prefix}
                {st.value}
                {st.suffix}
              </div>
              <div className="mt-2 text-sm text-white/70">{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-white px-10 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 font-mono text-xs uppercase tracking-widest text-green-700">
            What we do
          </div>
          <h2 className="mb-12 font-display text-4xl font-bold text-navy-800">
            Three disciplines, one team
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {data.services.map((sv) => (
              <div
                key={sv.id}
                className="rounded-lg border border-slate-200 border-t-4 p-6"
                style={{ borderTopColor: ACCENT }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                  {/* Icon placeholder */}
                  <span className="text-xs">⚡</span>
                </div>
                <div className="font-mono text-xs text-slate-400">{sv.code}</div>
                <h3 className="mt-1 font-display text-xl font-bold text-navy-800">
                  {sv.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {sv.shortDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="bg-white px-10 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 font-mono text-xs uppercase tracking-widest text-green-700">
            Selected work
          </div>
          <h2 className="mb-12 font-display text-4xl font-bold text-navy-800">
            Projects in the field
          </h2>

          {grid.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-navy-200 px-6 py-12 text-center font-body text-slate-500">
              No published projects yet — publish a project to see it here.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {grid.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className="overflow-hidden rounded-lg border border-slate-200 transition-shadow hover:shadow-md"
                >
                  <div className="relative h-48 bg-black">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={`/${p.images[0].storedPath.replace(/^public\//, '')}`}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-navy-50 text-navy-300">
                        <span className="text-xs">PROJECT PHOTO</span>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 inline-block rounded bg-navy-800 px-2.5 py-1 font-mono text-xs uppercase text-white">
                      {p.sector}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-navy-800">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {p.summary}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {data.testimonials.length > 0 && (
        <section className="bg-slate-50 px-10 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 font-mono text-xs uppercase tracking-widest text-green-700">
              What clients say
            </div>
            <h2 className="mb-12 font-display text-4xl font-bold text-navy-800">
              Testimonials
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {data.testimonials.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-t-4 border-slate-200 bg-white p-6"
                  style={{ borderTopColor: ACCENT }}
                >
                  <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="text-green-600">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="font-display font-bold text-navy-800">
                      {t.author}
                    </p>
                    <p className="text-xs text-slate-500">{t.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-navy-950 px-10 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <div className="font-bold text-white">MEPM</div>
              <p className="mt-2 text-xs text-white/60">Building Services Consultants</p>
            </div>
            <div>
              <h4 className="font-semibold">Services</h4>
              <ul className="mt-2 space-y-1 text-xs text-white/60">
                {data.services.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Contact</h4>
              <p className="mt-2 text-xs text-white/60">
                {data.settings.phone}
              </p>
              <p className="text-xs text-white/60">{data.settings.email}</p>
            </div>
            <div>
              <h4 className="font-semibold">Follow</h4>
              <div className="mt-2 flex gap-3 text-xs text-white/60">
                {/* Social links would go here */}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} MEPM. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function CaseStudyPreview({
  project,
  onBack,
}: {
  project: ProjectDTO;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-10 py-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-navy-700 hover:text-navy-900"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Hero image */}
      {project.images && project.images.length > 0 && (
        <div className="relative h-96 bg-black">
          <img
            src={`/${project.images[0].storedPath.replace(/^public\//, '')}`}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <article className="mx-auto max-w-3xl px-10 py-16">
        <div className="mb-6 inline-block rounded-full bg-navy-50 px-3 py-1 font-mono text-xs uppercase text-navy-700">
          {project.sector}
        </div>
        <h1 className="font-display text-5xl font-bold text-navy-800">
          {project.title}
        </h1>
        <p className="mt-4 text-xl text-slate-600">{project.summary}</p>

        {/* Meta */}
        <div className="mt-8 grid gap-4 rounded-lg bg-slate-50 p-6 sm:grid-cols-4">
          {project.client && (
            <div>
              <div className="font-mono text-xs uppercase text-slate-400">
                Client
              </div>
              <div className="mt-1 font-display font-bold text-navy-800">
                {project.client}
              </div>
            </div>
          )}
          {project.location && (
            <div>
              <div className="font-mono text-xs uppercase text-slate-400">
                Location
              </div>
              <div className="mt-1 font-display font-bold text-navy-800">
                {project.location}
              </div>
            </div>
          )}
          {project.year && (
            <div>
              <div className="font-mono text-xs uppercase text-slate-400">
                Year
              </div>
              <div className="mt-1 font-display font-bold text-navy-800">
                {project.year}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        {project.detail && (
          <div className="prose mt-12 max-w-none">
            <p className="text-lg leading-relaxed text-slate-700">
              {project.detail}
            </p>
          </div>
        )}

        {/* Gallery */}
        {project.images && project.images.length > 1 && (
          <div className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold text-navy-800">
              Gallery
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {project.images.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={`/${img.storedPath.replace(/^public\//, '')}`}
                  alt={img.caption || `${project.title} ${i + 1}`}
                  className="rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
