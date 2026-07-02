import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap, Wind, Thermometer, Droplet, Leaf, Sun,
  Flame, Snowflake, Wrench, Gauge, Building2, Recycle,
} from 'lucide-react';
import { getServices } from '@/lib/services';
import { Reveal } from '@/app/components/ui';
import { CtaBand } from '@/app/components/sections';

// Matches the curated set in app/admin/services/ServiceForm.tsx.
const SERVICE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Zap, Wind, Thermometer, Droplet, Leaf, Sun,
  Flame, Snowflake, Wrench, Gauge, Building2, Recycle,
};

export const metadata: Metadata = {
  title: 'Services — MEPM Building Services Consultants',
  description:
    'Electrical, mechanical and environmental engineering consultancy. Multi-disciplinary building services design from a single Hull-based team.',
};

// Always reflect the latest published services.
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const services = await getServices(true);

  return (
    <>
      <section className="bp-grid-light border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          <h1 className="mepm-display text-navy-700 mb-6">Services</h1>
          <p className="mepm-lead max-w-2xl">
            Three disciplines, one team. Most projects need at least two of
            them, and designing them together is the point.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service, i) => {
            const ServiceIcon = SERVICE_ICONS[service.icon] ?? Zap;
            return (
            <Reveal key={service.slug} delay={i * 0.08} className="h-full">
              <Link
                href={`/services/${service.slug}`}
                className="group flex flex-col h-full border border-slate-200 rounded-lg p-8 hover:border-navy-300 hover:shadow-md transition-all duration-200"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-navy-50 text-navy-700 group-hover:bg-navy-700 group-hover:text-white transition-colors">
                  <ServiceIcon size={22} />
                </div>
                <span className="font-mono text-sm font-semibold text-green-700 mb-5">
                  {service.code}
                </span>
                <h2 className="mepm-h3 text-navy-700 mb-3">{service.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {service.shortDescription}
                </p>
                <ul className="space-y-1.5 mb-8">
                  {service.keywords.map((keyword) => (
                    <li key={keyword} className="text-sm text-slate-500">
                      {keyword}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto text-sm font-medium text-navy-700 group-hover:text-green-600 transition-colors">
                  Explore {service.navLabel.toLowerCase()} →
                </span>
              </Link>
            </Reveal>
            );
          })}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
