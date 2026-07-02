'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Icon, Button, Badge, useToast } from '@/components/admin';

interface Project {
  id: string;
  title: string;
  sector: string;
  status: string;
  featured?: boolean;
  hero?: string;
  updated: string;
}

interface Enquiry {
  id: string;
  name: string;
  company: string;
  service: string;
  message: string;
  date: string;
  status: string;
}

interface DashboardData {
  projects: Project[];
  enquiries: Enquiry[];
  team: any[];
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function timeAgo(iso: string): string {
  try {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return Math.floor(d / 60) + 'm ago';
    if (d < 86400) return Math.floor(d / 3600) + 'h ago';
    if (d < 604800) return Math.floor(d / 86400) + 'd ago';
    return formatDate(iso);
  } catch {
    return '';
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastNode, toast] = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, enquiriesRes, teamRes] = await Promise.all([
          fetch('/api/projects?admin=1'),
          fetch('/api/enquiries'),
          fetch('/api/team'),
        ]);

        if (!projectsRes.ok || !enquiriesRes.ok || !teamRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const projectsData = await projectsRes.json();
        const enquiriesData = await enquiriesRes.json();
        const teamData = await teamRes.json();

        // Handle both wrapped { projects: [...] } and direct array formats
        const projects = Array.isArray(projectsData) ? projectsData : projectsData?.projects || [];
        const enquiries = Array.isArray(enquiriesData) ? enquiriesData : enquiriesData?.enquiries || [];
        const team = Array.isArray(teamData) ? teamData : teamData?.team || [];

        setData({
          projects,
          enquiries,
          team,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast('Failed to load dashboard', 'AlertTriangle');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-400)' }}>
        Loading…
      </div>
    );
  }

  if (!data) return null;

  const getIsPublished = (p: Project) => {
    // Check new status field first, then fall back to published boolean
    if (p.status === 'published') return true;
    if (p.status === 'draft') return false;
    // Fallback for old status values: use published field
    return p.published ?? false;
  };
  const published = data.projects.filter((p) => getIsPublished(p)).length;
  const drafts = data.projects.filter((p) => !getIsPublished(p)).length;
  const newEnq = data.enquiries.filter((e) => e.status === 'new').length;
  const featured = data.projects.filter((p) => p.featured);
  const recentProjects = [...data.projects]
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
    .slice(0, 4);
  const recentEnq = [...data.enquiries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const tiles = [
    { label: 'Published projects', value: published, icon: 'FolderCheck', tone: 'navy' },
    { label: 'Drafts', value: drafts, icon: 'FilePen', tone: 'amber' },
    { label: 'New enquiries', value: newEnq, icon: 'Inbox', tone: 'green' },
    { label: 'Team members', value: data.team.length, icon: 'Users', tone: 'slate' },
  ];

  const toneColors: Record<string, string> = {
    navy: 'var(--navy-700)',
    amber: 'var(--warning)',
    green: 'var(--green-600)',
    slate: 'var(--slate-500)',
  };

  return (
    <div>
      <PageHeader
        eyebrow="MEPM Control"
        title="Dashboard"
        desc="Everything that powers the MEPM website, in one place."
        actions={
          <>
            <Button variant="secondary" icon="external-link" onClick={() => window.location.href = '/admin/preview'}>
              View live site
            </Button>
            <Link href="/admin/projects/new" style={{ textDecoration: 'none' }}>
              <Button variant="accent" icon="plus">New project</Button>
            </Link>
          </>
        }
      />

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {tiles.map((t, idx) => {
          const c = toneColors[t.tone];
          const getHref = () => {
            if (idx === 0) return '/admin/projects?status=Published';
            if (idx === 1) return '/admin/projects?status=Draft';
            if (idx === 2) return '/admin/enquiries?status=new';
            if (idx === 3) return '/admin/team';
            return '#';
          };
          return (
            <Link key={t.label} href={getHref()} style={{ textDecoration: 'none' }}>
              <Card hover style={{ padding: '22px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      background: c + '14',
                      color: c,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={t.icon as any} size={22} stroke={1.9} />
                  </div>
                  <Icon name="ArrowUpRight" size={17} style={{ color: 'var(--slate-300)' }} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '40px',
                    letterSpacing: '-.02em',
                    color: 'var(--navy-800)',
                    marginTop: '16px',
                    lineHeight: 1,
                  }}
                >
                  {t.value}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13.5px',
                    color: 'var(--slate-600)',
                    marginTop: '8px',
                  }}
                >
                  {t.label}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Projects & Enquiries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Recently Updated */}
        <SectionCard
          title="Recently updated"
          action={
            <Link href="/admin/projects" style={{ textDecoration: 'none' }}>
              <button style={linkBtn}>
                All projects <Icon name="ArrowRight" size={14} />
              </button>
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentProjects.map((p, i) => (
              <Link key={p.id} href={`/admin/projects/${p.id}/edit`} style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '13px 0',
                    borderTop: i ? '1px solid var(--border)' : 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 'var(--radius-sm)',
                      flex: 'none',
                      background: p.hero ? '#000' : 'var(--navy-50)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {p.hero ? (
                      <img src={p.hero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Icon name="Image" size={17} style={{ color: 'var(--navy-300)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>
                      {p.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--slate-400)', marginTop: 2 }}>
                      {p.sector} · updated {timeAgo(p.updated)}
                    </div>
                  </div>
                  <Badge tone={getIsPublished(p) ? 'green' : 'amber'} dot>
                    {getIsPublished(p) ? 'Published' : 'Draft'}
                  </Badge>
                </button>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Latest Enquiries */}
        <SectionCard
          title="Latest enquiries"
          action={
            <Link href="/admin/enquiries" style={{ textDecoration: 'none' }}>
              <button style={linkBtn}>
                Inbox <Icon name="ArrowRight" size={14} />
              </button>
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentEnq.map((e, i) => (
              <button
                key={e.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '13px 0',
                  borderTop: i ? '1px solid var(--border)' : 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ width: 8, marginTop: 6, flex: 'none' }}>
                  {e.status === 'new' && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#68B830',
                        display: 'block',
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--navy-800)' }}>
                    {e.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12.5,
                      color: 'var(--slate-500)',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {e.company} · {e.service}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-400)', flex: 'none' }}>
                  {timeAgo(e.date)}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Featured on Homepage */}
      <div style={{ marginTop: 20 }}>
        <SectionCard
          title="Featured on homepage"
          sub={`${featured.length} of 3 slots used`}
          action={
            <Link href="/admin/preview" style={{ textDecoration: 'none' }}>
              <button style={linkBtn}>
                Preview <Icon name="ArrowRight" size={14} />
              </button>
            </Link>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[0, 1, 2].map((i) => {
              const p = featured[i];
              if (!p) {
                return (
                  <div
                    key={i}
                    style={{
                      height: 92,
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px dashed var(--navy-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--navy-300)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '.06em',
                    }}
                  >
                    EMPTY SLOT
                  </div>
                );
              }
              return (
                <Link key={p.id} href={`/admin/projects/${p.id}/edit`} style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--slate-50)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 'var(--radius-sm)',
                        flex: 'none',
                        background: p.hero ? '#000' : 'var(--navy-100)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.hero ? (
                        <img src={p.hero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icon name="Image" size={18} style={{ color: 'var(--navy-300)' }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-400)', marginTop: 3 }}>
                        {p.sector}
                      </div>
                    </div>
                  </button>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {toastNode}
    </div>
  );
}

function SectionCard({
  title,
  sub,
  action,
  children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', margin: 0 }}>
            {title}
          </h3>
          {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-400)', marginTop: 3 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: '8px 22px 18px' }}>{children}</div>
    </div>
  );
}

const linkBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13.5,
  color: 'var(--navy-700)',
} as const;
