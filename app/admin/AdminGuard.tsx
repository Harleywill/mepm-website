'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side route guard for admin pages. Verifies the session against
 * /api/auth/me (the httpOnly cookie isn't readable from JS). This is UX only
 * — every admin API route independently enforces auth server-side.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok'>('checking');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!active) return;
        if (res.ok) setState('ok');
        else router.replace('/admin/login');
      })
      .catch(() => {
        if (active) router.replace('/admin/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (state === 'checking') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="mepm-spec text-slate-400">Checking session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
