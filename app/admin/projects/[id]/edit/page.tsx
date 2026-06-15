'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ProjectDTO } from '@/lib/projects';
import ProjectForm from '../../../ProjectForm';

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(async (r) => {
        if (r.status === 404) return setState('missing');
        const data = await r.json();
        setProject(data.project);
        setState('ready');
      })
      .catch(() => setState('missing'));
  }, [params.id]);

  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 mepm-spec text-slate-500 hover:text-navy-700"
      >
        <ArrowLeft size={14} /> All projects
      </Link>
      {state === 'loading' && (
        <p className="mt-6 mepm-spec text-slate-400">Loading…</p>
      )}
      {state === 'missing' && (
        <p className="mt-6 text-slate-600">That project could not be found.</p>
      )}
      {state === 'ready' && project && (
        <>
          <h1 className="mepm-h2 mt-5 mb-8 text-navy-700">{project.title}</h1>
          <ProjectForm project={project} />
        </>
      )}
    </div>
  );
}
