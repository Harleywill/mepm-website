'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Card, Icon, Button, useToast } from '@/components/admin';

interface DashboardStats {
  projects: number;
  enquiries: number;
  newEnquiries: number;
  services: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastNode, toast] = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projectsRes, enquiriesRes, servicesRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/enquiries'),
          fetch('/api/services'),
        ]);

        if (!projectsRes.ok || !enquiriesRes.ok || !servicesRes.ok) {
          throw new Error('Failed to fetch stats');
        }

        const projectsData = await projectsRes.json();
        const enquiriesData = await enquiriesRes.json();
        const servicesData = await servicesRes.json();

        const newEnquiries = Array.isArray(enquiriesData)
          ? enquiriesData.filter((e: any) => e.status === 'new').length
          : 0;

        setStats({
          projects: Array.isArray(projectsData) ? projectsData.length : 0,
          enquiries: Array.isArray(enquiriesData) ? enquiriesData.length : 0,
          newEnquiries,
          services: Array.isArray(servicesData) ? servicesData.length : 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        toast('Failed to load dashboard stats', 'AlertTriangle');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const tiles = stats
    ? [
        {
          label: 'Published projects',
          value: stats.projects,
          icon: 'FolderCheck',
          tone: 'navy',
          href: '/admin/projects',
        },
        {
          label: 'New enquiries',
          value: stats.newEnquiries,
          icon: 'Inbox',
          tone: 'green',
          href: '/admin/enquiries',
        },
        {
          label: 'All enquiries',
          value: stats.enquiries,
          icon: 'Mail',
          tone: 'slate',
          href: '/admin/enquiries',
        },
        {
          label: 'Services',
          value: stats.services,
          icon: 'Layers',
          tone: 'navy',
          href: '/admin/settings',
        },
      ]
    : [];

  const toneColors: Record<string, string> = {
    navy: 'var(--navy-700)',
    green: 'var(--green-600)',
    slate: 'var(--slate-500)',
  };

  return (
    <div>
      <PageHeader
        eyebrow="MEPM Control"
        title="Dashboard"
        desc="Everything that powers the MEPM website, in one place."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="font-mono text-slate-400">Loading…</span>
        </div>
      ) : stats ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
            marginBottom: '24px',
          }}
        >
          {tiles.map((t) => {
            const c = toneColors[t.tone];
            return (
              <Card
                key={t.label}
                hover
                onClick={() => {
                  if (t.href) window.location.href = t.href;
                }}
                style={{ padding: '22px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
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
                  <Icon
                    name="ArrowUpRight"
                    size={17}
                    style={{ color: 'var(--slate-300)' }}
                  />
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
            );
          })}
        </div>
      ) : null}

      {toastNode}
    </div>
  );
}
