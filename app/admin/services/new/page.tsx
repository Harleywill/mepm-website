import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ServiceForm from '../ServiceForm';

export default function NewServicePage() {
  return (
    <div>
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-1.5 mepm-spec text-slate-500 hover:text-navy-700"
      >
        <ArrowLeft size={14} /> All services
      </Link>
      <h1 className="mepm-h2 mt-5 mb-8 text-navy-700">New service</h1>
      <ServiceForm />
    </div>
  );
}
