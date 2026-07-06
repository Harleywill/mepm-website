'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/admin';
import type { LoginAttemptDTO } from '@/lib/login-attempts';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type LoadState = 'loading' | 'forbidden' | 'ok';

export default function SecurityPage() {
  const [attempts, setAttempts] = useState<LoginAttemptDTO[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    fetch('/api/login-attempts')
      .then(async (r) => {
        if (r.status === 403) {
          setState('forbidden');
          return;
        }
        const d = await r.json();
        setAttempts(d.attempts ?? []);
        setState('ok');
      })
      .catch(() => setState('forbidden'));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 text-navy-700">Security</h1>
        <p className="mt-1 text-sm text-slate-600">
          The last 100 login attempts against the admin panel, most recent first.
        </p>
      </div>

      {state === 'loading' ? (
        <div className="py-16 text-center mepm-spec text-slate-400">Loading…</div>
      ) : state === 'forbidden' ? (
        <div className="rounded-lg border border-slate-200 bg-white py-16 text-center">
          <p className="mepm-spec text-slate-400">
            Administrators only — you don&apos;t have permission to view this page.
          </p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white py-16 text-center">
          <p className="mepm-spec text-slate-400">No login attempts recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          {attempts.map((entry, i) => {
            const meta = entry.success
              ? { icon: 'ShieldCheck', color: '#1B7F3A', bg: '#EAF7EF' }
              : { icon: 'ShieldAlert', color: '#D14343', bg: '#FBECEC' };
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 px-6 py-4 ${i !== attempts.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon name={meta.icon as any} size={16} stroke={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold text-navy-700">{entry.username}</span>{' '}
                    {entry.success ? 'signed in' : 'failed to sign in'}{' '}
                    <span className="font-mono text-xs text-slate-400">from {entry.ipAddress}</span>
                  </p>
                </div>
                <div className="flex-none font-mono text-xs text-slate-400" title={new Date(entry.createdAt).toLocaleString('en-GB')}>
                  {timeAgo(entry.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
