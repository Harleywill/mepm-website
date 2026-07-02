'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Icon, SortableList } from '@/components/admin';
import type { ServiceDTO, ServiceOfferingDTO } from '@/lib/services';
import { FieldGroup, TagListEditor } from './ServiceForm';

interface OfferingFormData {
  name: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  order: number;
}

const EMPTY_OFFERING: OfferingFormData = {
  name: '',
  shortDescription: '',
  description: '',
  keywords: [],
  order: 0,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [offerings, setOfferings] = useState<ServiceOfferingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<
    { kind: 'service' | 'offering'; id: string; name: string } | null
  >(null);

  // 'new' means a blank card is being added; a real id means that card is being edited.
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/services?admin=1').then((r) => r.json()),
      fetch('/api/service-offerings').then((r) => r.json()),
    ])
      .then(([svcRes, offRes]) => {
        setServices(svcRes.services ?? []);
        setOfferings(offRes.offerings ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const reorderServices = (reordered: ServiceDTO[]) => {
    setServices(reordered);
    fetch('/api/services/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
    });
  };

  const reorderOfferings = (reordered: ServiceOfferingDTO[]) => {
    setOfferings(reordered);
    fetch('/api/service-offerings/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((o) => o.id) }),
    });
  };

  const remove = async () => {
    if (!deleteConfirm) return;
    const { kind, id } = deleteConfirm;
    const endpoint = kind === 'service' ? `/api/services/${id}` : `/api/service-offerings/${id}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      load();
    }
  };

  const saveOffering = async (id: string | 'new', data: OfferingFormData) => {
    const url = id === 'new' ? '/api/service-offerings' : `/api/service-offerings/${id}`;
    const method = id === 'new' ? 'POST' : 'PATCH';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditingId(null);
      load();
      return null;
    }
    const json = await res.json().catch(() => ({}));
    return json.error || 'Could not save.';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">Services</h1>
          <p className="mt-1 text-sm text-slate-600">
            Discipline blocks and delivery lines shown across the public site
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <Plus size={17} /> Add service
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center mepm-spec text-slate-400">Loading…</div>
      ) : (
        <>
          <h2 className="mb-4 mepm-spec text-slate-500">Disciplines ({services.length})</h2>
          <div className="mb-10 flex flex-col gap-4">
            <SortableList items={services} getId={(sv) => sv.id} onReorder={reorderServices}>
              {(sv, dragHandle) => (
              <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-xs">

                {dragHandle}
                <div className="flex h-13 w-13 flex-none items-center justify-center rounded-md bg-navy-700 text-white">
                  <Icon name={sv.icon as any} size={26} stroke={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tracking-widest text-slate-400">{sv.code}</span>
                    <h3 className="font-archivo text-xl font-bold text-navy-800">{sv.name}</h3>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${
                        sv.published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sv.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                    {sv.shortDescription}
                  </p>
                  {sv.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sv.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded bg-slate-100 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-slate-600"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {sv.statValue && (
                  <div className="flex-none text-right">
                    {sv.statLabel && (
                      <div className="mb-0.5 font-mono text-[10px] tracking-wide text-slate-400">
                        {sv.statLabel}
                      </div>
                    )}
                    <div
                      className="font-archivo text-2xl font-bold"
                      style={{
                        color: sv.statValue.includes('-')
                          ? '#E74C3C'
                          : sv.statValue === 'A'
                            ? '#68B830'
                            : 'var(--navy-800)',
                      }}
                    >
                      {sv.statValue}
                    </div>
                  </div>
                )}
                <div className="flex flex-none gap-1.5">
                  <Link
                    href={`/admin/services/${sv.id}/edit`}
                    title="Edit"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm({ kind: 'service', id: sv.id, name: sv.name })}
                    title="Delete"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              )}
            </SortableList>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="mepm-spec text-slate-500">
              Delivery lines ({offerings.length}) — shown on every service page under &quot;How we deliver it&quot;
            </h2>
            {editingId === null && (
              <button
                onClick={() => setEditingId('new')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
              >
                <Plus size={14} /> Add delivery line
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {editingId === 'new' && (
              <OfferingCard
                editing
                onSave={(data) => saveOffering('new', data)}
                onCancel={() => setEditingId(null)}
              />
            )}
            <SortableList items={offerings} getId={(o) => o.id} onReorder={reorderOfferings}>
              {(o, dragHandle) =>
              editingId === o.id ? (
                <OfferingCard
                  offering={o}
                  editing
                  onSave={(data) => saveOffering(o.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  {dragHandle}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-archivo text-base font-bold text-navy-800">{o.name}</h3>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
                      {o.shortDescription}
                    </p>
                  </div>
                  <div className="flex flex-none gap-1.5">
                    <button
                      onClick={() => setEditingId(o.id)}
                      title="Edit"
                      disabled={editingId !== null}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-navy-50 hover:text-navy-700 transition-colors disabled:opacity-40"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ kind: 'offering', id: o.id, name: o.name })}
                      title="Delete"
                      disabled={editingId !== null}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
              }
            </SortableList>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-navy-800 mb-2">
              Delete {deleteConfirm.kind === 'service' ? 'service' : 'delivery line'}?
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              &quot;{deleteConfirm.name}&quot; will be removed from the website. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OfferingCard({
  offering,
  editing,
  onSave,
  onCancel,
}: {
  offering?: ServiceOfferingDTO;
  editing: boolean;
  onSave: (data: OfferingFormData) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(offering?.name ?? EMPTY_OFFERING.name);
  const [shortDescription, setShortDescription] = useState(
    offering?.shortDescription ?? EMPTY_OFFERING.shortDescription
  );
  const [description, setDescription] = useState(offering?.description ?? EMPTY_OFFERING.description);
  const [keywords, setKeywords] = useState<string[]>(offering?.keywords ?? []);
  const [order, setOrder] = useState(offering?.order ?? EMPTY_OFFERING.order);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!editing) return null;

  const save = async () => {
    if (!name.trim() || !shortDescription.trim() || !description.trim()) {
      setError('Name, short description, and description are required.');
      return;
    }
    setSaving(true);
    setError('');
    const err = await onSave({ name, shortDescription, description, keywords, order });
    if (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-navy-300 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="mepm-spec text-green-700">
          {offering ? 'Editing' : 'New delivery line'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Check size={13} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <X size={13} /> Cancel
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <FieldGroup label="Name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Consulting"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
          />
        </FieldGroup>

        <FieldGroup label="Short description" hint="Admin list preview only — not shown publicly">
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
          />
        </FieldGroup>

        <FieldGroup label="Description" hint="Shown publicly under &quot;How we deliver it&quot;">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
          />
        </FieldGroup>

        <TagListEditor label="Keywords" items={keywords} onChange={setKeywords} />

        <div className="w-32">
          <FieldGroup label="Order">
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
            />
          </FieldGroup>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
