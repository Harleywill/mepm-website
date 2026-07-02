'use client';

import { usePathname } from 'next/navigation';
import type { SiteSettingsDTO } from '@/lib/settings';
import type { ServiceDTO } from '@/lib/services';
import Header from './Header';
import Footer from './Footer';

/**
 * Renders the public site chrome (contact bar, nav, footer) around the page,
 * except under /admin where the admin layout provides its own shell.
 */
export default function SiteChrome({
  children,
  settings,
  services,
}: {
  children: React.ReactNode;
  settings: SiteSettingsDTO;
  services: ServiceDTO[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header settings={settings} services={services} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} services={services} />
    </>
  );
}
