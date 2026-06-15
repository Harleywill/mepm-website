'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  type AdminEnquiry,
} from '@/lib/enquiries';
import StatusBadge from '../../ui/StatusBadge';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EnquiryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [enquiry, setEnquiry] = useState<AdminEnquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const patchStatus = useCallback(
    async (status: string) => {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiry((prev) => (prev ? { ...prev, status: data.enquiry.status } : prev));
      }
    },
    [id]
  );

  useEffect(() => {
    let active = true;
    fetch(`/api/enquiries/${id}`)
      .then(async (r) => {
        if (!active) return;
        if (r.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await r.json();
        setEnquiry(data.enquiry);
        setLoading(false);
        // Auto-advance a brand-new enquiry to "read" on open.
        if (data.enquiry?.status === 'new') patchStatus('read');
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, patchStatus]);

  const remove = async () => {
    if (!confirm('Delete this enquiry and its attachments? This cannot be undone.'))
      return;
    const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/enquiries');
  };

  if (loading) {
    return <p className="mepm-spec text-slate-400">Loading…</p>;
  }
  if (notFound || !enquiry) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-slate-600">That enquiry could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <BackLink />

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">{enquiry.name}</h1>
          <p className="mepm-spec mt-1 text-slate-500">
            {formatDateTime(enquiry.createdAt)}
          </p>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Row label="Email">
          <a
            href={`mailto:${enquiry.email}`}
            className="text-navy-700 hover:text-green-600"
          >
            {enquiry.email}
          </a>
        </Row>
        {enquiry.phone && (
          <Row label="Phone">
            <a
              href={`tel:${enquiry.phone}`}
              className="text-navy-700 hover:text-green-600"
            >
              {enquiry.phone}
            </a>
          </Row>
        )}
        {enquiry.organisation && <Row label="Organisation">{enquiry.organisation}</Row>}
        {enquiry.service && <Row label="Service">{enquiry.service}</Row>}
      </div>

      <div className="mt-6">
        <h2 className="mepm-spec mb-2">Message</h2>
        <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-5 text-slate-700">
          {enquiry.message}
        </p>
      </div>

      {enquiry.attachments.length > 0 && (
        <div className="mt-6">
          <h2 className="mepm-spec mb-2">Attachments</h2>
          <ul className="space-y-2">
            {enquiry.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={`/api/enquiries/${id}/attachments/${a.id}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 hover:border-navy-300 hover:bg-navy-50/40"
                >
                  <Download size={18} className="text-navy-700" />
                  <span className="flex-1 text-sm font-medium text-navy-700">
                    {a.filename}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {formatSize(a.size)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <label className="flex items-center gap-3 text-sm">
          <span className="mepm-spec">Status</span>
          <select
            value={enquiry.status}
            onChange={(e) => patchStatus(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
          >
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ENQUIRY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={remove}
          className="inline-flex items-center gap-2 rounded-md border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/enquiries"
      className="inline-flex items-center gap-1.5 mepm-spec text-slate-500 hover:text-navy-700"
    >
      <ArrowLeft size={14} /> All enquiries
    </Link>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-slate-100 px-5 py-3.5 last:border-0">
      <span className="mepm-spec w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-700">{children}</span>
    </div>
  );
}
