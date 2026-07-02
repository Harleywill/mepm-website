'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/admin';
import type { ActivityLogDTO } from '@/lib/activity';

const ACTION_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  create: { icon: 'Plus', color: '#1B7F3A', bg: '#EAF7EF' },
  update: { icon: 'Pencil', color: '#1a2f6e', bg: '#EEF1FB' },
  delete: { icon: 'Trash2', color: '#D14343', bg: '#FBECEC' },
};

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

function actionVerb(action: string): string {
  if (action === 'create') return 'created';
  if (action === 'delete') return 'deleted';
  return 'updated';
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLogDTO[] | null>(null);

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => r.json())
      .then((d) => setActivity(d.activity ?? []))
      .catch(() => setActivity([]));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 text-navy-700">History</h1>
        <p className="mt-1 text-sm text-slate-600">
          The last 100 content changes across the CMS, most recent first.
        </p>
      </div>

      {activity === null ? (
        <div className="py-16 text-center mepm-spec text-slate-400">Loading…</div>
      ) : activity.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white py-16 text-center">
          <p className="mepm-spec text-slate-400">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          {activity.map((entry, i) => {
            const meta = ACTION_ICON[entry.action] ?? ACTION_ICON.update;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 px-6 py-4 ${i !== activity.length - 1 ? 'border-b border-slate-100' : ''}`}
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
                    {actionVerb(entry.action)}{' '}
                    <span className="font-mono text-xs uppercase tracking-wide text-slate-400">
                      {entry.entityType}
                    </span>{' '}
                    <span className="font-medium">{entry.entityLabel}</span>
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
