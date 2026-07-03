import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { disciplinesToArray, imageUrl } from '@/lib/projects';
import { Reveal } from '../ui';

export default async function LatestProjects() {
  const projects = await prisma.project.findMany({
    where: { published: true, featured: true },
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 3,
  });

  // Nothing featured yet — render nothing rather than an empty section.
  if (projects.length === 0) return null;

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="mepm-h2 text-navy-700 mb-4">Latest projects</h2>
              <p className="mepm-lead max-w-xl">
                A selection of the buildings we have engineered.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-sm font-medium text-navy-700 transition-colors hover:text-green-600"
            >
              All projects →
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const cover = p.images.find((img) => img.isCover) ?? p.images[0];
            const disciplines = disciplinesToArray(p.disciplines);
            return (
              <Reveal key={p.id} delay={i * 0.08}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-44 items-center justify-center overflow-hidden bg-slate-50">
                    {cover ? (
                      <Image
                        src={imageUrl(cover.storedPath)}
                        alt={p.title}
                        width={640}
                        height={176}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="mepm-spec text-slate-300">MEPM</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="mepm-spec text-green-700">
                        {disciplines.join(' · ') || 'MEP'}
                      </span>
                      {p.sector && (
                        <span className="font-mono text-[11px] text-slate-400">
                          {p.sector}
                        </span>
                      )}
                    </div>
                    <h3 className="font-body font-semibold text-navy-700 group-hover:text-green-600">
                      {p.title}
                    </h3>
                    {p.summary && (
                      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {p.summary}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
