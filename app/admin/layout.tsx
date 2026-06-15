'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import AdminGuard from './AdminGuard';

const LOGO = '/assets/mepm-logo-tight.png';

const NAV = [
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Projects', href: '/admin/projects' },
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

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin/enquiries" aria-label="MEPM admin">
                <Image
                  src={LOGO}
                  alt="MEPM"
                  width={110}
                  height={32}
                  style={{ width: 'auto', height: '30px' }}
                  priority
                />
              </Link>
              <nav className="flex items-center gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-navy-50 text-navy-700'
                        : 'text-slate-600 hover:text-navy-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-700"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      </div>
    </AdminGuard>
  );
}
