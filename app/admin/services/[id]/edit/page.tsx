'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ServiceDTO, ServiceScopeItem } from '@/lib/services';
import ServiceForm from '../../ServiceForm';

function parseArr<T = string>(json: string): T[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceDTO | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    fetch(`/api/services/${params.id}`)
      .then(async (r) => {
        if (r.status === 404) return setState('missing');
        const data = await r.json();
        const raw = data.service;
        setService({
          id: raw.id,
          slug: raw.slug,
          code: raw.code,
          name: raw.name,
          navLabel: raw.navLabel,
          shortDescription: raw.shortDescription,
          intro: raw.intro,
          keywords: parseArr<string>(raw.keywords),
          scope: parseArr<ServiceScopeItem>(raw.scope),
          deliverables: parseArr<string>(raw.deliverables),
          sustainability: raw.sustainability,
          relatedSlugs: parseArr<string>(raw.relatedSlugs),
          statValue: raw.statValue,
          statLabel: raw.statLabel,
          order: raw.order,
          published: raw.published,
          icon: raw.icon,
        });
        setState('ready');
      })
      .catch(() => setState('missing'));
  }, [params.id]);

  return (
    <div>
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-1.5 mepm-spec text-slate-500 hover:text-navy-700"
      >
        <ArrowLeft size={14} /> All services
      </Link>
      {state === 'loading' && <p className="mt-6 mepm-spec text-slate-400">Loading…</p>}
      {state === 'missing' && (
        <p className="mt-6 text-slate-600">That service could not be found.</p>
      )}
      {state === 'ready' && service && (
        <>
          <h1 className="mepm-h2 mt-5 mb-8 text-navy-700">{service.name}</h1>
          <ServiceForm service={service} />
        </>
      )}
    </div>
  );
}
