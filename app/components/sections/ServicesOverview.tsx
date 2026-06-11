import Link from 'next/link';
import { services } from '@/lib/services';
import { Reveal } from '../ui';

export default function ServicesOverview() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="mepm-h2 text-navy-700 mb-4">What we do</h2>
            <p className="mepm-lead max-w-xl">
              Electrical, mechanical and environmental engineering, designed
              together from day one.
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm font-medium text-navy-700 hover:text-green-600 transition-colors mb-1.5"
          >
            All services →
          </Link>
        </div>
      </Reveal>

      <div>
        {services.map((service, i) => (
          <Reveal key={service.slug} delay={i * 0.08}>
            <Link
              href={`/services/${service.slug}`}
              className="group grid gap-x-8 gap-y-2 md:grid-cols-[72px_minmax(0,1.1fr)_44px] lg:grid-cols-[72px_minmax(0,1.1fr)_minmax(0,0.9fr)_44px] md:items-center border-t border-slate-200 py-9 px-4 -mx-4 hover:bg-slate-50 transition-colors duration-200"
            >
              <span className="font-mono text-sm font-semibold text-green-700">
                {service.code}
              </span>
              <span>
                <span className="block mepm-h3 text-navy-700">
                  {service.name}
                </span>
                <span className="block text-sm text-slate-600 leading-relaxed mt-2 max-w-md">
                  {service.shortDescription}
                </span>
              </span>
              <span className="hidden lg:block text-sm text-slate-500 leading-relaxed">
                {service.keywords.join(' · ')}
              </span>
              <span
                className="hidden md:flex w-11 h-11 rounded-full border border-slate-200 items-center justify-center text-slate-400 group-hover:border-green-500 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-200"
                aria-hidden
              >
                →
              </span>
            </Link>
          </Reveal>
        ))}
        <div className="border-t border-slate-200 -mx-4" />
      </div>
    </section>
  );
}
