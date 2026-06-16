'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import type {
  SiteSettingsDTO,
  StatDTO,
  QualificationDTO,
} from '@/lib/settings';

const input =
  'w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60 focus:border-navy-300 transition-colors';
const label = 'mb-1.5 block text-sm font-medium text-navy-700';

type StatRow = Pick<StatDTO, 'prefix' | 'value' | 'suffix' | 'label'>;
type QualRow = { label: string };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsDTO | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [quals, setQuals] = useState<QualRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setStats(
          (d.stats as StatDTO[]).map((s) => ({
            prefix: s.prefix,
            value: s.value,
            suffix: s.suffix,
            label: s.label,
          }))
        );
        setQuals((d.qualifications as QualificationDTO[]).map((q) => ({ label: q.label })));
      });
  }, []);

  const set = (k: keyof SiteSettingsDTO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((prev) => (prev ? { ...prev, [k]: e.target.value } : prev));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, stats, qualifications: quals }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!settings) return <p className="mepm-spec text-slate-400">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mepm-h2 mb-8 text-navy-700">Settings</h1>

      <Section title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input value={settings.phone} onChange={set('phone')} className={input} />
          </Field>
          <Field label="Email">
            <input value={settings.email} onChange={set('email')} className={input} />
          </Field>
          <Field label="Address line 1">
            <input value={settings.addressLine1} onChange={set('addressLine1')} className={input} />
          </Field>
          <Field label="Address line 2">
            <input value={settings.addressLine2} onChange={set('addressLine2')} className={input} />
          </Field>
          <Field label="Address line 3">
            <input value={settings.addressLine3} onChange={set('addressLine3')} className={input} />
          </Field>
        </div>
      </Section>

      <Section title="Social links">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook URL">
            <input value={settings.facebook} onChange={set('facebook')} className={input} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="X / Twitter URL">
            <input value={settings.twitter} onChange={set('twitter')} className={input} placeholder="https://x.com/…" />
          </Field>
          <Field label="Instagram URL">
            <input value={settings.instagram} onChange={set('instagram')} className={input} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="LinkedIn URL">
            <input value={settings.linkedin} onChange={set('linkedin')} className={input} placeholder="https://linkedin.com/…" />
          </Field>
        </div>
      </Section>

      <Section
        title="Stat strip"
        hint="The count-up figures in the navy band. Value is the number that counts up; prefix/suffix wrap it (e.g. −40%)."
        onAdd={() => setStats((p) => [...p, { prefix: '', value: 0, suffix: '', label: '' }])}
      >
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={s.prefix}
                onChange={(e) => setStats((p) => p.map((x, j) => (j === i ? { ...x, prefix: e.target.value } : x)))}
                className={`${input} w-14`}
                placeholder="±"
                aria-label="Prefix"
              />
              <input
                type="number"
                value={s.value}
                onChange={(e) => setStats((p) => p.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))}
                className={`${input} w-24`}
                aria-label="Value"
              />
              <input
                value={s.suffix}
                onChange={(e) => setStats((p) => p.map((x, j) => (j === i ? { ...x, suffix: e.target.value } : x)))}
                className={`${input} w-16`}
                placeholder="%/+"
                aria-label="Suffix"
              />
              <input
                value={s.label}
                onChange={(e) => setStats((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                className={`${input} flex-1`}
                placeholder="Label, e.g. Years in practice"
                aria-label="Label"
              />
              <RemoveButton onClick={() => setStats((p) => p.filter((_, j) => j !== i))} />
            </div>
          ))}
          {stats.length === 0 && <Empty>No stats. Add one above.</Empty>}
        </div>
      </Section>

      <Section
        title="Qualifications"
        hint="Credentials/memberships shown as chips in the stat strip band."
        onAdd={() => setQuals((p) => [...p, { label: '' }])}
      >
        <div className="space-y-3">
          {quals.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={q.label}
                onChange={(e) => setQuals((p) => p.map((x, j) => (j === i ? { label: e.target.value } : x)))}
                className={`${input} flex-1`}
                placeholder="e.g. CIBSE Member, CEng, IET"
                aria-label="Qualification"
              />
              <RemoveButton onClick={() => setQuals((p) => p.filter((_, j) => j !== i))} />
            </div>
          ))}
          {quals.length === 0 && <Empty>No qualifications yet. Add one above.</Empty>}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-green-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
            <Check size={16} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  onAdd,
  children,
}: {
  title: string;
  hint?: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-body font-semibold text-navy-700">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
          >
            <Plus size={15} /> Add
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{l}</span>
      {children}
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-danger/5 hover:text-danger"
      aria-label="Remove"
    >
      <Trash2 size={16} />
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mepm-spec text-slate-400">{children}</p>;
}
