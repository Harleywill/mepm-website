import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { services, getService } from '@/lib/services';

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
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Page header */}
      <div className="max-w-2xl mb-16">
        <Link
          href="/services"
          className="text-sm text-slate-500 hover:text-navy-700 transition-colors"
        >
          ← All services
        </Link>
        <h1 className="mepm-h1 text-navy-700 mt-4 mb-6">{service.name}</h1>
        <p className="mepm-lead text-slate-600">{service.intro}</p>
      </div>

      {/* Scope */}
      <section className="mb-16">
        <h2 className="mepm-h3 text-navy-700 mb-8">What we cover</h2>
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {service.scope.map((item) => (
            <div key={item.title}>
              <h3 className="font-body font-semibold text-base text-navy-700 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Deliverables */}
      <section className="mb-16 max-w-2xl">
        <h2 className="mepm-h3 text-navy-700 mb-6">What you receive</h2>
        <ul className="space-y-3">
          {service.deliverables.map((item) => (
            <li key={item} className="flex gap-3 text-slate-600">
              <span className="text-green-600 font-semibold" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Sustainability */}
      <section className="mb-16 max-w-2xl">
        <h2 className="mepm-h3 text-navy-700 mb-4">Sustainability</h2>
        <p className="text-slate-600 leading-relaxed">{service.sustainability}</p>
      </section>

      {/* Related services */}
      <section className="border-t border-slate-200 pt-12">
        <h2 className="mepm-h4 text-navy-700 mb-6">Often combined with</h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          {related.map((rel) => (
            <Link
              key={rel.slug}
              href={`/services/${rel.slug}`}
              className="group block border border-slate-200 rounded-lg p-6 hover:border-navy-300 hover:shadow-md transition-all duration-200"
            >
              <h3 className="font-body font-semibold text-base text-navy-700 mb-2">
                {rel.name}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {rel.shortDescription}
              </p>
              <span className="text-sm font-medium text-navy-700 group-hover:text-green-600 transition-colors">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
