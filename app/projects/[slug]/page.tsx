import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  disciplinesToArray,
  DISCIPLINE_LABELS,
  isProjectStatus,
  imageUrl,
  PROJECT_STATUS_LABELS,
} from '@/lib/projects';
import { LightboxProvider, LightboxTrigger, type LightboxImage } from '../../components/ui';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string) {
  return prisma.project.findFirst({
    where: { slug, published: true },
    include: { images: { orderBy: { order: 'asc' } } },
  });
}

/** Prerender all published projects at build time; slugs created later
 *  render on demand (dynamicParams) and are then cached until revalidated. */
export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — MEPM Projects`,
    description: project.summary || undefined,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const cover =
    project.images.find((i) => i.isCover) ?? project.images[0] ?? null;
  const gallery = project.images.filter((i) => i.id !== cover?.id);
  const disciplines = disciplinesToArray(project.disciplines);

  // Cover + gallery share one navigable lightbox sequence, cover first.
  const allImages: LightboxImage[] = [
    ...(cover ? [{ id: cover.id, src: imageUrl(cover.storedPath), caption: cover.caption }] : []),
    ...gallery.map((img) => ({ id: img.id, src: imageUrl(img.storedPath), caption: img.caption })),
  ];

  const titleBlock: [string, string][] = [
    ['Client', project.client || '—'],
    ['Location', project.location || '—'],
    ['Sector', project.sector || '—'],
    [
      'Disciplines',
      disciplines.map((d) => DISCIPLINE_LABELS[d]).join(', ') || '—',
    ],
    [
      'Status',
      isProjectStatus(project.status)
        ? PROJECT_STATUS_LABELS[project.status]
        : project.status,
    ],
    ['Year', project.year ? String(project.year) : '—'],
  ];

  return (
    <LightboxProvider images={allImages}>
      <section className="bp-grid-light border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-16">
          <Link
            href="/projects"
            className="mepm-spec text-slate-500 hover:text-navy-700"
          >
            ← All projects
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
            <div>
              <h1 className="mepm-display text-navy-700">{project.title}</h1>
              {project.summary && (
                <p className="mepm-lead mt-5 max-w-xl">{project.summary}</p>
              )}
              {cover && (
                <LightboxTrigger
                  index={0}
                  className="mt-8 flex max-h-[480px] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  {/* Drawings vary in aspect; contain so the full sheet shows. */}
                  <Image
                    src={imageUrl(cover.storedPath)}
                    alt={cover.caption ?? project.title}
                    width={1600}
                    height={480}
                    className="max-h-[480px] w-full object-contain"
                  />
                </LightboxTrigger>
              )}
            </div>

            {/* Title block */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <span className="mepm-spec">MEPM · Project sheet</span>
                <span className="font-mono text-xs font-semibold text-green-700">
                  {disciplines.join('·') || 'MEP'}
                </span>
              </div>
              <dl className="px-5 py-4">
                {titleBlock.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"
                  >
                    <dt className="mepm-spec pt-0.5">{k}</dt>
                    <dd className="text-right text-sm font-medium text-navy-700">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {(project.detail || gallery.length > 0) && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          {project.detail && (
            <div className="max-w-2xl">
              {project.detail.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="mb-4 text-slate-700 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          )}

          {gallery.length > 0 && (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((img, i) => (
                <figure
                  key={img.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <LightboxTrigger
                    index={(cover ? 1 : 0) + i}
                    className="block w-full cursor-zoom-in"
                  >
                    <Image
                      src={imageUrl(img.storedPath)}
                      alt={img.caption ?? project.title}
                      width={800}
                      height={224}
                      className="h-56 w-full object-contain"
                    />
                  </LightboxTrigger>
                  {img.caption && (
                    <figcaption className="px-4 py-2.5 text-sm text-slate-500">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </section>
      )}
    </LightboxProvider>
  );
}
