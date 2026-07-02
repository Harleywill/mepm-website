'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SortableList } from '@/components/admin';

interface Stat {
  id: string;
  prefix: string;
  value: number;
  suffix: string;
  label: string;
  order: number;
}

export default function SiteStatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/site-stats');
        const data = await res.json();
        setStats(Array.isArray(data) ? data : data.stats || []);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStat = (id: string, field: string, value: any) => {
    setStats((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: field === 'value' ? Number(value) : value } : s
      )
    );
  };

  const deleteStat = (id: string) => {
    setStats((prev) => prev.filter((s) => s.id !== id));
  };

  const addStat = () => {
    const newStat: Stat = {
      id: 'new-' + Date.now(),
      prefix: '',
      value: 0,
      suffix: '',
      label: '',
      order: stats.length,
    };
    setStats((prev) => [...prev, newStat]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/site-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('Failed to save stats:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)', margin: 0 }}>
            Site stats
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.04em', color: 'var(--slate-500)', marginTop: 6 }}>
            The number metrics in the homepage stat band. Keep these fresh — they read as engineering credentials.
          </p>
        </div>
        <button
          onClick={addStat}
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
          }}
        >
          <Plus size={17} /> Add stats
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-400)' }}>
          Loading…
        </div>
      ) : (
        <>
          {/* Preview strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 32,
              padding: '24px',
              background: 'var(--navy-700)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {stats.map((stat) => (
              <div key={stat.id} style={{ textAlign: 'center', color: '#fff' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 32,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.prefix}
                  {stat.value}
                  {stat.suffix}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Edit forms */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <SortableList items={stats} getId={(s) => s.id} onReorder={setStats}>
              {(stat, dragHandle) => {
              const idx = stats.findIndex((s) => s.id === stat.id);
              return (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {dragHandle}
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: 'var(--slate-400)',
                      }}
                    >
                      STAT {idx + 1}
                    </div>
                  </div>
                  {stat.id.startsWith('new-') ? (
                    <button
                      onClick={() => deleteStat(stat.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#D14343',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'var(--slate-500)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      PREFIX
                    </label>
                    <input
                      type="text"
                      value={stat.prefix}
                      onChange={(e) => updateStat(stat.id, 'prefix', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'var(--slate-500)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      VALUE
                    </label>
                    <input
                      type="number"
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, 'value', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'var(--slate-500)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      SUFFIX
                    </label>
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => updateStat(stat.id, 'suffix', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'var(--slate-500)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    LABEL
                  </label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => updateStat(stat.id, 'label', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
              );
              }}
            </SortableList>
          </div>

          {/* Save button */}
          {stats.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: '#68B830',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
