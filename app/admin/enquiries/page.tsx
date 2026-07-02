'use client';

import { useEffect, useState } from 'react';
import { Mail, Calendar, Tag } from 'lucide-react';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  type AdminEnquiry,
} from '@/lib/enquiries';
import { Icon } from '@/components/admin';

function timeAgo(iso: string): string {
  try {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return Math.floor(d / 60) + 'm ago';
    if (d < 86400) return Math.floor(d / 3600) + 'h ago';
    if (d < 604800) return Math.floor(d / 86400) + 'd ago';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const FILTERS = ['all', 'new', 'read', 'replied'] as const;

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/enquiries?admin=1')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.enquiries ?? []).sort(
          (a: AdminEnquiry, b: AdminEnquiry) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEnquiries(list);
        if (list.length > 0 && !selected) setSelected(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = enquiries.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'new') return e.status === 'new';
    return e.status === filter;
  });

  const active = enquiries.find((e) => e.id === selected);
  const newCount = enquiries.filter((e) => e.status === 'new').length;

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: data.enquiry.status } : e
          )
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteEnquiry = async (id: string, name: string) => {
    if (!confirm(`Delete the enquiry from ${name}? This cannot be undone.`))
      return;
    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEnquiries((prev) => prev.filter((e) => e.id !== id));
        setSelected(null);
      }
    } catch (err) {
      console.error('Failed to delete enquiry', err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)', margin: 0 }}>
              Enquiries
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.04em', color: 'var(--slate-500)', marginTop: 6 }}>
              {newCount} new
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 13.5,
                padding: '8px 16px',
                borderRadius: 999,
                cursor: 'pointer',
                border: `1.5px solid ${filter === f ? 'var(--navy-600)' : 'var(--border)'}`,
                background: filter === f ? 'var(--navy-700)' : '#fff',
                color: filter === f ? '#fff' : 'var(--slate-600)',
                transition: 'all var(--dur-fast)',
              }}
            >
              {f === 'all' ? 'All' : f === 'new' ? 'Unread' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 0,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          minHeight: 480,
          background: '#fff',
        }}
      >
        {/* List column */}
        <div
          style={{
            borderRight: '1px solid var(--border)',
            background: 'var(--slate-50)',
            overflowY: 'auto',
            maxHeight: 620,
          }}
        >
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate-500)' }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate-500)' }}>
              Nothing here.
            </div>
          ) : (
            filtered.map((e) => {
              const isActive = active && active.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelected(e.id);
                    if (e.status === 'new') updateStatus(e.id, 'read');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `3px solid ${isActive ? '#68B830' : 'transparent'}`,
                    background: isActive ? '#fff' : 'transparent',
                    padding: '16px 18px',
                    transition: 'background var(--dur-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      {e.status === 'new' && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#68B830',
                            flex: 'none',
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontWeight: e.status === 'new' ? 700 : 600,
                          fontSize: 14.5,
                          color: 'var(--navy-800)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {e.name}
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        color: 'var(--slate-400)',
                        flex: 'none',
                      }}
                    >
                      {timeAgo(e.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: '#68B830',
                      margin: '5px 0 4px',
                      letterSpacing: '.04em',
                    }}
                  >
                    {(e.service || '').toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--slate-500)',
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {e.message}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail column */}
        <div style={{ padding: active ? 32 : 0 }}>
          {active ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy-800)', margin: 0 }}>
                    {active.name}
                  </h2>
                  {active.organisation && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate-600)', marginTop: 5 }}>
                      {active.organisation}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 4, background: active.status === 'new' ? '#68B830' : active.status === 'replied' ? 'var(--slate-200)' : 'var(--navy-100)', color: active.status === 'new' ? '#fff' : active.status === 'replied' ? 'var(--slate-600)' : 'var(--navy-700)' }}>
                  {active.status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 22, marginBottom: 18, flexWrap: 'wrap' }}>
                <a
                  href={`mailto:${active.email}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'var(--navy-700)',
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={16} />
                  {active.email}
                </a>
                {active.phone && (
                  <a
                    href={`tel:${active.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      color: 'var(--navy-700)',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="Phone" size={16} />
                    {active.phone}
                  </a>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--slate-500)',
                  }}
                >
                  <Calendar size={15} />
                  {fmtDate(active.createdAt)}
                </span>
              </div>

              {active.service && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: '#68B830',
                    background: '#68B830' + '14',
                    padding: '6px 12px',
                    borderRadius: 999,
                    marginBottom: 18,
                  }}
                >
                  <Tag size={13} />
                  {active.service}
                </div>
              )}

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15.5,
                  lineHeight: 1.7,
                  color: 'var(--fg)',
                  background: 'var(--slate-50)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 22px',
                  margin: 0,
                  marginBottom: 22,
                }}
              >
                {active.message}
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href={`mailto:${active.email}?subject=RE: your enquiry to MEPM`}
                  style={{ textDecoration: 'none' }}
                  onClick={() => updateStatus(active.id, 'replied')}
                >
                  <button
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: '#68B830',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    disabled={saving}
                  >
                    <Icon name="Mail" size={16} />
                    Reply
                  </button>
                </a>
                {active.status !== 'replied' && (
                  <button
                    onClick={() => updateStatus(active.id, 'replied')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: '#fff',
                      color: 'var(--navy-700)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    disabled={saving}
                  >
                    <Icon name="Check" size={16} />
                    Mark replied
                  </button>
                )}
                {active.status !== 'new' && (
                  <button
                    onClick={() => updateStatus(active.id, 'new')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--slate-600)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    disabled={saving}
                  >
                    <Icon name="Mail" size={16} />
                    Mark unread
                  </button>
                )}
                <button
                  onClick={() => deleteEnquiry(active.id, active.name)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(209, 67, 67, 0.3)',
                    background: 'transparent',
                    color: '#D14343',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  disabled={saving}
                >
                  <Icon name="Trash2" size={16} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--slate-500)', fontFamily: 'var(--font-body)' }}>
                <Icon name="Inbox" size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 16, fontWeight: 600 }}>Inbox zero</p>
                <p style={{ fontSize: 14, color: 'var(--slate-400)' }}>
                  No enquiries to show.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
