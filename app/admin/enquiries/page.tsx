'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Paperclip, Search } from 'lucide-react';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  type AdminEnquiry,
} from '@/lib/enquiries';
import StatusBadge from '../ui/StatusBadge';

const FILTERS = ['all', ...ENQUIRY_STATUSES] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search.trim()) params.set('search', search.trim());

    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/enquiries?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          setEnquiries(data.enquiries ?? []);
          setLoading(false);
        })
        .catch(() => active && setLoading(false));
    }, 200); // debounce search typing

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filter, search]);

  // Keep the unread badge accurate regardless of the active filter.
  useEffect(() => {
    fetch('/api/enquiries?status=new')
      .then((r) => r.json())
      .then((d) => setNewCount(d.enquiries?.length ?? 0))
      .catch(() => {});
  }, [enquiries]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">Enquiries</h1>
          <p className="mepm-spec mt-1 text-slate-500">
            {newCount} new · {enquiries.length} shown
          </p>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, message"
            className="w-72 rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
          />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'border-navy-700 bg-navy-700 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300'
            }`}
          >
            {f === 'all' ? 'All' : ENQUIRY_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="px-6 py-16 text-center mepm-spec text-slate-400">
            Loading…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-slate-600">No enquiries here yet.</p>
            <p className="mepm-spec mt-1 text-slate-400">
              New submissions from the contact form will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  Name
                </th>
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  Service
                </th>
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  Status
                </th>
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  Date
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/enquiries/${e.id}`}
                      className="font-medium text-navy-700 hover:text-green-600"
                    >
                      {e.name}
                    </Link>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="truncate">{e.email}</span>
                      {e.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-slate-400">
                          <Paperclip size={12} />
                          {e.attachments.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {e.service || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {formatDate(e.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/enquiries/${e.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-green-600"
                    >
                      View <ArrowUpRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
