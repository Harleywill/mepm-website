'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/components/admin';

interface Accreditation {
  id: string;
  label: string;
}

export default function AccreditationsPage() {
  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState('');
  const [toastNode, toast] = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/accreditations');
        const data = await res.json();
        setAccreditations(Array.isArray(data) ? data : data.accreditations || []);
      } catch (error) {
        console.error('Failed to fetch accreditations:', error);
        toast('Failed to load accreditations', 'AlertTriangle');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const add = async () => {
    const val = newValue.trim();
    if (!val) return;

    try {
      const res = await fetch('/api/accreditations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: val }),
      });
      if (!res.ok) throw new Error('Failed to add');
      const data = await res.json();
      setAccreditations([...accreditations, data]);
      setNewValue('');
      toast('Accreditation added', 'Check');
    } catch (error) {
      console.error('Failed to add accreditation:', error);
      toast('Failed to add accreditation', 'AlertTriangle');
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/accreditations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setAccreditations(accreditations.filter((a) => a.id !== id));
      toast('Accreditation removed', 'Trash2');
    } catch (error) {
      console.error('Failed to delete accreditation:', error);
      toast('Failed to delete accreditation', 'AlertTriangle');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 mb-1 text-navy-700">Accreditations</h1>
        <p className="mepm-spec text-slate-500">
          Standards & memberships in the scrolling marquee under the hero
        </p>
      </div>

      {/* Marquee preview */}
      <div className="mb-6 overflow-hidden rounded-lg bg-navy-900 py-4">
        <div className="flex flex-wrap justify-center gap-0 px-4">
          {accreditations.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-2.5 px-6 py-1.5 font-mono text-sm uppercase tracking-widest text-white/70"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              {a.label}
            </span>
          ))}
        </div>
      </div>

      {/* Add new */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex gap-3">
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add an accreditation, e.g. BREEAM AP"
            className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60"
          />
          <button
            onClick={add}
            className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
          >
            <Plus size={17} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {loading ? (
          <p className="mepm-spec text-center text-slate-400">Loading…</p>
        ) : accreditations.length === 0 ? (
          <p className="mepm-spec text-center text-slate-400">
            No accreditations yet. Add one above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {accreditations.map((a) => (
              <div
                key={a.id}
                className="inline-flex items-center gap-3 rounded-full border border-navy-100 bg-navy-50 px-4 py-2.5 font-mono text-sm uppercase tracking-widest text-navy-700"
              >
                {a.label}
                <button
                  onClick={() => remove(a.id)}
                  className="text-slate-400 hover:text-slate-600"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {toastNode}
    </div>
  );
}
