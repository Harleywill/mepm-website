import type { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Services — MEPM Building Services Consultants',
  description:
    'Electrical, mechanical and environmental engineering consultancy. Multi-disciplinary building services design from a single Hull-based team.',
};

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="max-w-2xl mb-16">
        <h1 className="mepm-h1 text-navy-700 mb-6">Services</h1>
        <p className="mepm-lead text-slate-600">
          Three disciplines, one team. Most projects need at least two of them,
          and designing them together is the point.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group block border border-slate-200 rounded-lg p-8 hover:border-navy-300 hover:shadow-md transition-all duration-200"
          >
            <h2 className="mepm-h3 text-navy-700 mb-3">{service.name}</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {service.shortDescription}
            </p>
            <ul className="space-y-1.5 mb-6">
              {service.keywords.map((keyword) => (
                <li key={keyword} className="text-sm text-slate-500">
                  {keyword}
                </li>
              ))}
            </ul>
            <span className="text-sm font-medium text-navy-700 group-hover:text-green-600 transition-colors">
              Explore {service.navLabel.toLowerCase()} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
