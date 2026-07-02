'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Icon } from '@/components/admin';
import type { ServiceDTO, ServiceScopeItem } from '@/lib/services';

const CODES = ['ELE', 'MEC', 'ENV'] as const;

// Curated MEP-relevant set — keep in sync with the same list in app/admin/services/page.tsx
// and app/services/page.tsx, which also render icons by this name.
const ICONS = [
  'Zap', 'Wind', 'Thermometer', 'Droplet', 'Leaf', 'Sun',
  'Flame', 'Snowflake', 'Wrench', 'Gauge', 'Building2', 'Recycle',
] as const;

export interface ServiceFormData {
  code: string;
  name: string;
  navLabel: string;
  shortDescription: string;
  intro: string;
  keywords: string[];
  scope: ServiceScopeItem[];
  deliverables: string[];
  sustainability: string;
  relatedSlugs: string[];
  statValue: string;
  statLabel: string;
  order: number;
  published: boolean;
  icon: string;
}

const EMPTY: ServiceFormData = {
  code: 'ELE',
  name: '',
  navLabel: '',
  shortDescription: '',
  intro: '',
  keywords: [],
  scope: [],
  deliverables: [],
  sustainability: '',
  relatedSlugs: [],
  statValue: '',
  statLabel: '',
  order: 0,
  published: false,
  icon: 'Zap',
};

export default function ServiceForm({ service }: { service?: ServiceDTO }) {
  const router = useRouter();
  const editing = Boolean(service);

  const [code, setCode] = useState(service?.code ?? EMPTY.code);
  const [name, setName] = useState(service?.name ?? EMPTY.name);
  const [navLabel, setNavLabel] = useState(service?.navLabel ?? EMPTY.navLabel);
  const [shortDescription, setShortDescription] = useState(service?.shortDescription ?? EMPTY.shortDescription);
  const [intro, setIntro] = useState(service?.intro ?? EMPTY.intro);
  const [keywords, setKeywords] = useState<string[]>(service?.keywords ?? []);
  const [scope, setScope] = useState<ServiceScopeItem[]>(service?.scope ?? []);
  const [deliverables, setDeliverables] = useState<string[]>(service?.deliverables ?? []);
  const [sustainability, setSustainability] = useState(service?.sustainability ?? EMPTY.sustainability);
  const [relatedSlugs, setRelatedSlugs] = useState<string[]>(service?.relatedSlugs ?? []);
  const [statValue, setStatValue] = useState(service?.statValue ?? EMPTY.statValue);
  const [statLabel, setStatLabel] = useState(service?.statLabel ?? EMPTY.statLabel);
  const [order, setOrder] = useState(service?.order ?? EMPTY.order);
  const [published, setPublished] = useState(service?.published ?? EMPTY.published);
  const [icon, setIcon] = useState(service?.icon ?? EMPTY.icon);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const payload = () => ({
    code,
    name,
    navLabel,
    shortDescription,
    intro,
    keywords,
    scope,
    deliverables,
    sustainability,
    relatedSlugs,
    statValue,
    statLabel,
    order,
    published,
    icon,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing && service) {
        const res = await fetch(`/api/services/${service.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Could not save.');
        }
        router.push('/admin/services');
        router.refresh();
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Could not create.');
        }
        router.push('/admin/services');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      {/* Sticky Editor Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/services')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="mepm-spec text-green-700">{editing ? 'Editing' : 'New service'}</div>
            <h1 className="mt-0.5 font-archivo text-xl font-bold text-navy-800">
              {name || 'Untitled discipline'}
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create service'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/services')}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* MAIN COLUMN */}
        <div className="flex flex-col gap-5">
          <Panel>
            <FieldGroup label="Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electrical engineering"
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
              />
            </FieldGroup>
            <div className="h-4" />
            <FieldGroup label="Short description" hint={`${shortDescription.length}/160`}>
              <textarea
                value={shortDescription}
                maxLength={160}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-line description shown on the services card & nav."
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
                style={{ minHeight: 64 }}
              />
            </FieldGroup>
          </Panel>

          <Panel>
            <FieldGroup label="Intro" hint="Hero paragraph on the service detail page">
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="From initial load assessments through to detailed design…"
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
                style={{ minHeight: 90 }}
              />
            </FieldGroup>
          </Panel>

          <Panel>
            <TagListEditor label="Keywords" items={keywords} onChange={setKeywords} />
          </Panel>

          <Panel>
            <ScopeEditor items={scope} onChange={setScope} />
          </Panel>

          <Panel>
            <TagListEditor label="Deliverables" items={deliverables} onChange={setDeliverables} />
          </Panel>

          <Panel>
            <FieldGroup label="Sustainability blurb">
              <textarea
                value={sustainability}
                onChange={(e) => setSustainability(e.target.value)}
                placeholder="How this discipline connects to sustainability outcomes."
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
                style={{ minHeight: 90 }}
              />
            </FieldGroup>
          </Panel>
        </div>

        {/* SIDE COLUMN */}
        <div className="flex flex-col gap-5">
          <Panel>
            <FieldGroup label="Code">
              <div className="flex gap-2">
                {CODES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCode(c)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      code === c
                        ? 'border-navy-600 bg-navy-50 text-navy-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </Panel>

          <Panel>
            <FieldGroup label="Icon">
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={`flex aspect-square items-center justify-center rounded-md border transition-colors ${
                      icon === iconName
                        ? 'border-navy-600 bg-navy-50 text-navy-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-navy-300'
                    }`}
                  >
                    <Icon name={iconName} size={18} />
                  </button>
                ))}
              </div>
            </FieldGroup>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <span className="mepm-spec text-slate-500">Published</span>
              <button
                type="button"
                onClick={() => setPublished(!published)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors ${
                  published ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 mepm-spec text-slate-400">
              {published ? 'Visible on the public site' : 'Hidden from the public site until published'}
            </p>
          </Panel>

          <Panel>
            <FieldGroup label="Nav label">
              <input
                value={navLabel}
                onChange={(e) => setNavLabel(e.target.value)}
                placeholder="Electrical"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
              />
            </FieldGroup>
          </Panel>

          <Panel>
            <TagListEditor
              label="Related service slugs"
              items={relatedSlugs}
              onChange={setRelatedSlugs}
              placeholder="e.g. mechanical"
            />
          </Panel>

          <Panel>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Stat value">
                <input
                  value={statValue}
                  onChange={(e) => setStatValue(e.target.value)}
                  placeholder="100+"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
                />
              </FieldGroup>
              <FieldGroup label="Stat label">
                <input
                  value={statLabel}
                  onChange={(e) => setStatLabel(e.target.value)}
                  placeholder="Projects"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
                />
              </FieldGroup>
            </div>
            <div className="mt-3">
              <FieldGroup label="Order">
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
                />
              </FieldGroup>
            </div>
          </Panel>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5.5 shadow-xs">
      {children}
    </div>
  );
}

export function FieldGroup({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label className="mepm-body text-sm font-medium text-navy-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {hint && <span className="mepm-spec text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function TagListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <FieldGroup label={label}>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-red-600"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft('');
            }
          }
        }}
        placeholder={placeholder ?? 'Type a value and press Enter'}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
      />
    </FieldGroup>
  );
}

function ScopeEditor({
  items,
  onChange,
}: {
  items: ServiceScopeItem[];
  onChange: (items: ServiceScopeItem[]) => void;
}) {
  return (
    <FieldGroup label="Scope items" hint={`${items.length} item${items.length === 1 ? '' : 's'}`}>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="mepm-spec text-slate-400">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={item.title}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], title: e.target.value };
                onChange(next);
              }}
              placeholder="Title"
              className="mb-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
            />
            <textarea
              value={item.description}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], description: e.target.value };
                onChange(next);
              }}
              placeholder="Description"
              rows={2}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/60 resize-none"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { title: '', description: '' }])}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
      >
        <Plus size={14} /> Add scope item
      </button>
    </FieldGroup>
  );
}
