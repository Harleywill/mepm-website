'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Check, Download, Upload, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/admin';
import type {
  SiteSettingsDTO,
  StatDTO,
  QualificationDTO,
} from '@/lib/settings';

const RESET_PHRASE = 'delete all demo data';

const input =
  'w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60 focus:border-navy-300 transition-colors';
const label = 'mb-1.5 block text-sm font-medium text-navy-700';

// In the admin the user edits a single "figure" string (e.g. "29", "−40%",
// "98%", "480+"). We split it into prefix/number/suffix for the count-up
// animation only at save time, and rejoin it when loading.
type StatRow = { figure: string; label: string };
type QualRow = { label: string };

function buildFigure(prefix: string, value: number, suffix: string) {
  return `${prefix}${value}${suffix}`;
}

function parseFigure(figure: string): {
  prefix: string;
  value: number;
  suffix: string;
} {
  const m = figure.trim().match(/^(\D*?)(\d+)(\D*)$/);
  if (!m) return { prefix: figure.trim(), value: 0, suffix: '' };
  return { prefix: m[1], value: Number(m[2]), suffix: m[3] };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsDTO | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [quals, setQuals] = useState<QualRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [content, setContent] = useState<{
    projects: number;
    enquiries: number;
    testimonials: number;
    team: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<Record<
    string,
    { imported: number; skipped: number; errors: string[] }
  > | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setCurrentUserRole(d.ok ? d.role : null))
      .catch(() => setCurrentUserRole(null));

    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setStats(
          (d.stats as StatDTO[]).map((s) => ({
            figure: buildFigure(s.prefix, s.value, s.suffix),
            label: s.label,
          }))
        );
        setQuals((d.qualifications as QualificationDTO[]).map((q) => ({ label: q.label })));
      });

    // Fetch content counts
    Promise.all([
      fetch('/api/projects?admin=1').then((r) => r.json()),
      fetch('/api/enquiries').then((r) => r.json()),
      fetch('/api/testimonials').then((r) => r.json()),
      fetch('/api/team').then((r) => r.json()),
    ]).then(([projects, enquiries, testimonials, team]) => {
      const projectsData = Array.isArray(projects) ? projects : projects.projects || [];
      const enquiriesData = Array.isArray(enquiries) ? enquiries : enquiries.enquiries || [];
      const testimonialsData = Array.isArray(testimonials) ? testimonials : testimonials.testimonials || [];
      const teamData = Array.isArray(team) ? team : team.team || [];
      setContent({
        projects: projectsData.length,
        enquiries: enquiriesData.length,
        testimonials: testimonialsData.length,
        team: teamData.length,
      });
    });
  }, []);

  const set = (k: keyof SiteSettingsDTO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((prev) => (prev ? { ...prev, [k]: e.target.value } : prev));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    // Split each figure into prefix/number/suffix for the public count-up.
    const statsPayload = stats
      .filter((s) => s.label.trim() || s.figure.trim())
      .map((s) => ({ ...parseFigure(s.figure), label: s.label }));
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, stats: statsPayload, qualifications: quals }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!settings) return <p className="mepm-spec text-slate-400">Loading…</p>;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mepm-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Import failed');
      setImportResult(json.results);
    } catch (err) {
      setImportResult({
        error: { imported: 0, skipped: 0, errors: [err instanceof Error ? err.message : 'Import failed. Check the file is a valid export JSON.'] },
      });
    } finally {
      setImporting(false);
    }
  };

  const openResetModal = () => {
    setResetConfirmText('');
    setResetModalOpen(true);
  };

  const handleResetData = async () => {
    if (resetConfirmText.trim().toLowerCase() !== RESET_PHRASE) return;
    setResetting(true);
    try {
      await fetch('/api/reset', { method: 'POST' });
      window.location.reload();
    } catch {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mepm-h2 mb-8 text-navy-700">Settings</h1>

      {/* Content overview */}
      {content && (
        <Section title="Content overview" hint="What's currently in the CMS.">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)' }}>
                {content.projects}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase', marginTop: 4 }}>
                Projects
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)' }}>
                {content.enquiries}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase', marginTop: 4 }}>
                Enquiries
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)' }}>
                {content.testimonials}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase', marginTop: 4 }}>
                Testimonials
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)' }}>
                {content.team}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase', marginTop: 4 }}>
                Team members
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Export section */}
      <Section title="Export" hint="Download all content — projects, services, team, testimonials and more — as a single JSON backup.">
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: '#68B830',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          <Download size={16} />
          {exporting ? 'Exporting…' : 'Export content'}
        </button>
      </Section>

      {/* Import section */}
      <Section title="Import" hint="Restore content from a backup JSON file. Existing records are matched by id and updated; new ones are added. Nothing is deleted, and admin accounts are never imported.">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleImportClick}
          disabled={importing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: '#fff',
            color: 'var(--navy-700)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            opacity: importing ? 0.6 : 1,
          }}
        >
          <Upload size={16} />
          {importing ? 'Importing…' : 'Choose file to import'}
        </button>

        {importResult && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(importResult).map(([key, summary]) => (
              <div key={key} style={{ fontSize: 13, color: 'var(--slate-600)' }}>
                <strong style={{ color: 'var(--navy-700)', textTransform: 'capitalize' }}>{key}</strong>
                {': '}
                {summary.imported} imported, {summary.skipped} skipped
                {summary.errors.length > 0 && (
                  <ul style={{ margin: '4px 0 0 18px', color: '#D14343' }}>
                    {summary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Reset data section — administrators only */}
      {currentUserRole === 'administrator' && (
        <Section title="Reset demo data" hint="Warning: this action clears all content and restores sample data. Use with caution.">
          <button
            onClick={openResetModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(209, 67, 67, 0.3)',
              background: 'transparent',
              color: '#D14343',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Reset to sample data
          </button>
        </Section>
      )}

      <Modal
        open={resetModalOpen}
        onClose={() => !resetting && setResetModalOpen(false)}
        eyebrow="Destructive action"
        title="Reset all demo data?"
        width={440}
      >
        <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 flex-none text-red-600" />
          <p className="text-sm leading-relaxed text-red-800">
            This permanently deletes{' '}
            {content
              ? `${content.projects} project${content.projects === 1 ? '' : 's'}, ${content.enquiries} enquir${content.enquiries === 1 ? 'y' : 'ies'}, ${content.testimonials} testimonial${content.testimonials === 1 ? '' : 's'}, and ${content.team} team member${content.team === 1 ? '' : 's'}`
              : 'all current content'}
            , then restores sample data in their place. There is no undo.
          </p>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Type <strong className="font-mono text-navy-800">{RESET_PHRASE}</strong> below to confirm.
        </p>
        <input
          autoFocus
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder={RESET_PHRASE}
          className={`${input} mt-2`}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setResetModalOpen(false)}
            disabled={resetting}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResetData}
            disabled={resetting || resetConfirmText.trim().toLowerCase() !== RESET_PHRASE}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resetting ? 'Resetting…' : 'Reset everything'}
          </button>
        </div>
      </Modal>

      <Section title="Contact details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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


      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur">
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
