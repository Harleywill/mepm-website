'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AdminGuard from './AdminGuard';
import UserProfile from './UserProfile';
import { Icon } from '@/components/admin';
import './styles/theme.css';

const NAV_GROUPS = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/admin/dashboard' },
      { id: 'activity', label: 'History', icon: 'History', href: '/admin/activity' },
    ],
  },
  {
    group: 'Content',
    items: [
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/admin/projects' },
      { id: 'enquiries', label: 'Enquiries', icon: 'Inbox', href: '/admin/enquiries' },
    ],
  },
  {
    group: 'Website',
    items: [
      { id: 'site-stats', label: 'Site stats', icon: 'BarChart3', href: '/admin/site-stats' },
      { id: 'services', label: 'Services', icon: 'Layers', href: '/admin/services' },
      { id: 'accreditations', label: 'Accreditations', icon: 'Award', href: '/admin/accreditations' },
      { id: 'qualifications', label: 'Qualifications', icon: 'Badge', href: '/admin/qualifications' },
      { id: 'testimonials', label: 'Testimonials', icon: 'Quote', href: '/admin/testimonials' },
      { id: 'team', label: 'Team', icon: 'Users', href: '/admin/team' },
    ],
  },
  {
    group: 'Library',
    items: [{ id: 'media', label: 'Media', icon: 'Images', href: '/admin/media' }],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // The login page renders bare — no shell, no guard (else redirect loop).
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  const isActive = (href: string) => pathname.startsWith(href);

  // Build breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter((p) => p && p !== 'admin');
    const breadcrumbs = [{ label: 'MEPM', href: '/' }];
    let path = '/admin';
    for (let i = 0; i < parts.length; i++) {
      path += '/' + parts[i];
      const label = parts[i]
        .replace(/-/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ label, href: path });
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--slate-50)' }}>
        {/* SIDEBAR */}
        <aside
          style={{
            width: 252,
            flex: 'none',
            background: 'var(--navy-950)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          {/* Logo */}
          <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/mepm-logo-white.png" alt="MEPM" style={{ height: '32px', width: 'auto' }} />
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
            {NAV_GROUPS.map((grp) => (
              <div key={grp.group} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.34)',
                    padding: '6px 12px 8px',
                  }}
                >
                  {grp.group}
                </div>
                {grp.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          marginBottom: 2,
                          background: active ? 'var(--navy-700)' : 'transparent',
                          color: active ? '#fff' : 'rgba(255,255,255,.72)',
                          position: 'relative',
                          transition: 'background var(--dur-fast)',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)';
                        }}
                        onMouseLeave={(e) => {
                          if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {active && (
                          <span
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 9,
                              bottom: 9,
                              width: 3,
                              borderRadius: 3,
                              background: '#68B830',
                            }}
                          />
                        )}
                        <Icon
                          name={item.icon as any}
                          size={18}
                          stroke={1.9}
                          style={{ color: active ? '#68B830' : 'rgba(255,255,255,.6)' }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontWeight: active ? 600 : 500,
                            fontSize: 14.5,
                            flex: 1,
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <UserProfile />

          {/* Settings & User */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  background: isActive('/admin/settings') ? 'var(--navy-700)' : 'transparent',
                  color: 'rgba(255,255,255,.72)',
                }}
              >
                <Icon name="Settings" size={18} stroke={1.9} style={{ color: 'rgba(255,255,255,.6)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5 }}>Settings</span>
              </button>
            </Link>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                cursor: 'pointer',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                background: 'transparent',
                color: 'rgba(255,255,255,.72)',
                marginTop: 8,
              }}
            >
              <Icon name="LogOut" size={18} stroke={1.9} style={{ color: 'rgba(255,255,255,.6)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5 }}>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <header
            style={{
              flex: 'none',
              height: 64,
              background: 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 36px',
              position: 'sticky',
              top: 0,
              zIndex: 40,
            }}
          >
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.06em', color: 'var(--slate-500)' }}>
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {idx > 0 && <Icon name="ChevronRight" size={14} style={{ color: 'var(--slate-300)' }} />}
                  <span style={{ color: idx === 0 ? 'var(--navy-700)' : idx === breadcrumbs.length - 1 ? 'var(--slate-700)' : 'var(--slate-500)' }}>
                    {crumb.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Right side - View live site & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--navy-700)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'all var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--navy-50)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--navy-300)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#fff';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                }}
              >
                <Icon name="ExternalLink" size={14} />
                View live site
              </a>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  letterSpacing: '.04em',
                  color: 'var(--green-700)',
                  background: 'var(--green-50)',
                  padding: '6px 12px',
                  borderRadius: 999,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#68B830' }}></span>
                SAVED LOCALLY
              </span>
            </div>
          </header>

          {/* Main Content */}
          <main id="mepm-main" style={{ flex: 1, overflowY: 'auto', padding: '36px 36px 64px' }}>
            <div style={{ maxWidth: 1140, margin: '0 auto' }}>{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
