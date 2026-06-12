import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { services, getService, serviceOfferings } from '@/lib/services';
import { Reveal } from '@/app/components/ui';
import { CtaBand, ServiceHero3D } from '@/app/components/sections';
import type { ServiceVariant } from '@/app/components/sections';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.name} — MEPM Building Services Consultants`,
    description: service.shortDescription,
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = service.relatedSlugs
    .map(getService)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      {/* Page hero — drawing sheet header */}
      <section className="bp-grid-light border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid gap-12 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start">
          <div>
            <Link
              href="/services"
              className="mepm-spec hover:text-navy-700 transition-colors"
            >
              ← All services
            </Link>
            <h1 className="mepm-display text-navy-700 mt-5 mb-6">
              {service.name.split(' ')[0]}
              <br />
              <span className="text-slate-400">
                {service.name.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="mepm-lead max-w-xl">{service.intro}</p>
          </div>

          {/* Figure above, title block below — like a real drawing sheet */}
          <Reveal delay={0.15}>
            <ServiceHero3D variant={service.slug as ServiceVariant} />
            <div className="mt-4 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="mepm-spec">MEPM · Service sheet</span>
                <span className="font-mono text-sm font-semibold text-green-700">
                  {service.code}
                </span>
              </div>
              <dl className="px-5 py-4 space-y-3">
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Discipline</dt>
                  <dd className="text-sm font-medium text-navy-700 text-right">
                    {service.navLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Scope items</dt>
                  <dd className="font-mono text-sm text-navy-700">
                    {String(service.scope.length).padStart(2, '0')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Combines with</dt>
                  <dd className="font-mono text-sm text-navy-700">
                    {related.map((r) => r.code).join(' · ')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Practice</dt>
                  <dd className="text-sm font-medium text-navy-700">
                    29 years
                  </dd>
                </div>
              </dl>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
                {service.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Scope — spec register */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <h2 className="mepm-h2 text-navy-700 mb-12">What we cover</h2>
        </Reveal>
        <div className="grid gap-x-12 md:grid-cols-2">
          {service.scope.map((item, i) => (
            <Reveal key={item.title} delay={(i % 2) * 0.08}>
              <div className="border-t border-slate-200 py-7 grid grid-cols-[64px_1fr] gap-5">
                <span className="font-mono text-sm font-medium text-green-700 pt-0.5">
                  {service.code}-{String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-body font-semibold text-base text-navy-700 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Service lines — register of how the discipline is delivered */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <Reveal>
            <h2 className="mepm-h2 text-navy-700 mb-4">
              How we deliver it
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-xl mb-12">
              Six service lines run across every discipline, from first
              feasibility check to final commissioning sign-off.
            </p>
          </Reveal>
          <div className="grid gap-x-12 md:grid-cols-2">
            {Object.entries(serviceOfferings).map(([key, offering], i) => (
              <Reveal key={key} delay={(i % 2) * 0.08}>
                <div className="border-t border-slate-300 py-7 grid grid-cols-[64px_1fr] gap-5">
                  <span className="font-mono text-sm font-medium text-green-700 pt-0.5">
                    SVC-{String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-body font-semibold text-base text-navy-700 mb-2">
                      {offering.name}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {offering.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables — dark band */}
      <section className="bg-navy-900 bp-grid">
        <div className="max-w-7xl mx-auto px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 className="mepm-h2 text-white mb-5">What you receive</h2>
            <p className="text-white/72 leading-relaxed max-w-md">
              Design work you can build from and evidence you can submit.
              Every output is produced to be used, not filed.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="space-y-4">
              {service.deliverables.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 items-start border-b border-white/12 pb-4"
                >
                  <span
                    className="mt-1 w-5 h-5 rounded-sm bg-mepm-green/20 border border-mepm-green/50 flex items-center justify-center text-mepm-green text-xs font-bold shrink-0"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Sustainability + related */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 h-full">
            <h2 className="mepm-h4 text-navy-700 mb-4">
              Where sustainability fits
            </h2>
            <p className="text-slate-700 leading-relaxed">
              {service.sustainability}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mepm-h4 text-navy-700 mb-5">Often combined with</h2>
          <div className="space-y-4">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/services/${rel.slug}`}
                className="group flex items-center gap-5 border border-slate-200 rounded-lg p-5 hover:border-navy-300 hover:shadow-md transition-all duration-200"
              >
                <span className="font-mono text-sm font-semibold text-green-700 w-11 shrink-0">
                  {rel.code}
                </span>
                <span className="flex-1">
                  <span className="block font-body font-semibold text-base text-navy-700">
                    {rel.name}
                  </span>
                  <span className="block text-sm text-slate-600 mt-0.5">
                    {rel.shortDescription}
                  </span>
                </span>
                <span
                  className="text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-200"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
