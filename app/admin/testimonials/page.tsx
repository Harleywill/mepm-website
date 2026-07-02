'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Quote } from 'lucide-react';
import {
  getTestimonials,
  updateTestimonial,
  deleteTestimonial,
} from '@/lib/mepm-api';

interface TestimonialData {
  id: string;
  quote: string;
  author: string;
  company?: string | null;
  logo?: string | null;
  order?: number;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<TestimonialData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTestimonials();
        setTestimonials(Array.isArray(data) ? data : data.testimonials || []);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEdit = (testimonial: TestimonialData) => {
    setEditingId(testimonial.id);
    setEditData(structuredClone(testimonial));
  };

  const handleSave = async () => {
    if (!editData || !editingId) return;
    try {
      const updated = await updateTestimonial(editingId, editData);
      setTestimonials(
        testimonials.map((t) => (t.id === editingId ? updated : t))
      );
      setEditingId(null);
      setEditData(null);
    } catch (error) {
      console.error('Failed to save testimonial:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">Testimonials</h1>
          <p className="mepm-spec mt-1 text-slate-500">
            {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''} — shown on the homepage carousel
          </p>
        </div>
        <a
          href="/admin/testimonials/new"
          className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <Plus size={17} /> Add testimonial
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="font-mono text-slate-400">Loading…</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg border bg-white p-6 ${
                editingId === t.id
                  ? 'border-green-200 bg-green-50'
                  : 'border-slate-200'
              }`}
            >
              {editingId === t.id && editData ? (
                <div>
                  <div className="mb-6">
                    <div className="text-xs font-mono uppercase tracking-widest text-green-700">
                      Editing testimonial
                    </div>
                    <h3 className="mt-1 text-xl font-bold text-navy-800">
                      {editData.author}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-navy-700">
                        Quote
                      </label>
                      <textarea
                        value={editData.quote}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            quote: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-navy-700">
                          Author
                        </label>
                        <input
                          type="text"
                          value={editData.author}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              author: e.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-navy-700">
                          Company
                        </label>
                        <input
                          type="text"
                          value={editData.company || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              company: e.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                      >
                        <Pencil size={15} /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditData(null);
                        }}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ borderTop: '3px solid #68B830', paddingTop: '20px' }}>
                  <Quote size={26} style={{ color: '#68B830', marginBottom: '12px' }} />
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '16px',
                      lineHeight: 1.6,
                      color: 'var(--navy-800)',
                      margin: '14px 0 20px',
                    }}
                  >
                    {t.quote}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '16px',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '14.5px',
                          color: 'var(--navy-800)',
                          margin: 0,
                        }}
                      >
                        {t.author}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11.5px',
                          color: 'var(--slate-500)',
                          margin: '2px 0 0',
                        }}
                      >
                        {t.company}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleEdit(t)}
                        title="Edit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-navy-50 hover:text-navy-700"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Delete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
