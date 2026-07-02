'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getTeam, deleteTeamMember } from '@/lib/mepm-api';
import { SortableList } from '@/components/admin';
import type { TeamMemberDTO } from '@/lib/team';

const DISCIPLINES = [
  'Electrical',
  'Mechanical',
  'Environmental',
];

const DISC_COLOR: Record<string, string> = {
  Electrical: '#ef6820',
  Mechanical: '#3b82f6',
  Environmental: '#10b981',
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTeam();
        setTeam(Array.isArray(data) ? data : data.team || []);
      } catch (error) {
        console.error('Failed to fetch team:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || null);
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      }
    };

    load();
    fetchUserRole();
  }, []);

  const canDelete = userRole === 'administrator' || userRole === 'editor';
  const canEdit = userRole === 'administrator' || userRole === 'editor';

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      await deleteTeamMember(id);
      setTeam(team.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete team member:', error);
    }
  };

  const reorderTeam = (reordered: TeamMemberDTO[]) => {
    setTeam(reordered);
    fetch('/api/team/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((m) => m.id) }),
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">Team</h1>
          <p className="mepm-spec mt-1 text-slate-500">
            {team.length} member{team.length !== 1 ? 's' : ''} — shown on the About page
          </p>
        </div>
        {canEdit && (
          <a
            href="/admin/team/new"
            className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
          >
            <Plus size={17} /> Add member
          </a>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="font-mono text-slate-400">Loading…</span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '18px',
          }}
        >
          <SortableList items={team} getId={(m) => m.id} onReorder={reorderTeam}>
            {(m, dragHandle) => (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow">
              <div
                style={{
                  height: '180px',
                  background: m.photo ? '#000' : 'var(--navy-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {canEdit && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1,
                      background: 'rgba(255,255,255,0.85)',
                      borderRadius: 6,
                    }}
                  >
                    {dragHandle}
                  </div>
                )}
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt={m.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--navy-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--navy-400)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '24px',
                    }}
                  >
                    {(m.name || '?').slice(0, 1)}
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 18px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '17px',
                    color: 'var(--navy-800)',
                  }}
                >
                  {m.name || 'Unnamed'}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13.5px',
                    color: 'var(--slate-600)',
                    marginTop: '2px',
                  }}
                >
                  {m.role}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background:
                        (DISC_COLOR[m.discipline] || '#888') + '15',
                      color: DISC_COLOR[m.discipline] || '#666',
                    }}
                  >
                    {m.discipline}
                  </span>
                </div>
                {(canEdit || canDelete) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '14px',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '12px',
                    }}
                  >
                    {canEdit && (
                      <a
                        href={`/admin/team/${m.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-navy-50 hover:text-navy-700"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </a>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(m.id, m.name)}
                        title="Delete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}
          </SortableList>
        </div>
      )}
    </div>
  );
}
