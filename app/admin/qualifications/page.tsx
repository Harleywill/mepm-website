'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/admin';

interface Qualification {
  id: string;
  label: string;
  order: number;
}

export default function QualificationsPage() {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastNode, toast] = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/qualifications');
        const data = await res.json();
        setQualifications(
          (Array.isArray(data) ? data : data.qualifications || []).sort(
            (a: Qualification, b: Qualification) => a.order - b.order
          )
        );
      } catch (error) {
        console.error('Failed to fetch qualifications:', error);
        toast('Failed to load qualifications', 'AlertTriangle');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const add = () => {
    const newQual: Qualification = {
      id: 'new-' + Date.now(),
      label: '',
      order: qualifications.length,
    };
    setQualifications([...qualifications, newQual]);
  };

  const update = (id: string, label: string) => {
    setQualifications((prev) =>
      prev.map((q) => (q.id === id ? { ...q, label } : q))
    );
  };

  const remove = (id: string) => {
    setQualifications((prev) => prev.filter((q) => q.id !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qualifications),
      });
      if (res.ok) {
        const data = await res.json();
        setQualifications(data.qualifications || []);
        toast('Qualifications saved', 'Check');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save qualifications:', error);
      toast('Failed to save qualifications', 'AlertTriangle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--navy-800)', margin: 0 }}>
            Qualifications
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.04em', color: 'var(--slate-500)', marginTop: 6 }}>
            Credentials &amp; memberships shown as chips in the stat strip band.
          </p>
        </div>
        <button
          onClick={add}
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
          <Plus size={17} /> Add qualification
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-400)' }}>
          Loading…
        </div>
      ) : (
        <>
          {/* List */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            {qualifications.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--slate-400)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, margin: 0 }}>
                  No qualifications yet. Add one above.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {qualifications.map((qual, idx) => (
                  <div
                    key={qual.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '16px 24px',
                      borderBottom: idx < qualifications.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <input
                      type="text"
                      value={qual.label}
                      onChange={(e) => update(qual.id, e.target.value)}
                      placeholder="e.g. CIBSE Member, CEng, IET"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                      }}
                    />
                    <button
                      onClick={() => remove(qual.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        background: '#fff',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        transition: 'all var(--dur-fast)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(209, 67, 67, 0.05)';
                        (e.currentTarget as HTMLElement).style.color = '#D14343';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(209, 67, 67, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#fff';
                        (e.currentTarget as HTMLElement).style.color = 'var(--slate-400)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save button */}
          {qualifications.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={save}
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

      {toastNode}
    </div>
  );
}
