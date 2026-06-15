import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProjectForm from '../../ProjectForm';

export default function NewProjectPage() {
  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 mepm-spec text-slate-500 hover:text-navy-700"
      >
        <ArrowLeft size={14} /> All projects
      </Link>
      <h1 className="mepm-h2 mt-5 mb-8 text-navy-700">New project</h1>
      <ProjectForm />
    </div>
  );
}
