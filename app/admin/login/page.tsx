'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/api-client';
import { Button } from '@/components/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const result = await login(username, password);
    if (result.success) {
      router.replace('/admin/enquiries');
      router.refresh();
    } else {
      setError(result.error || 'Login failed');
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen grid gap-0"
      style={{ gridTemplateColumns: '1.05fr .95fr' }}
    >
      {/* Brand panel */}
      <div
        className="relative overflow-hidden px-14 py-14 flex flex-col justify-between"
        style={{
          background: 'var(--navy-950)',
          color: '#fff',
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        ></div>

        {/* Radial gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 80% 90%, rgba(104,184,48,.22), transparent 55%)',
          }}
        ></div>

        <Image
          src="/mepm-logo.png"
          alt="MEPM"
          width={710}
          height={308}
          style={{ height: '52px', width: 'auto', position: 'relative', alignSelf: 'flex-start' }}
          priority
        />

        <div style={{ position: 'relative' }}>
          <div
            className="font-mono text-xs tracking-widest uppercase"
            style={{ color: 'var(--green-400)' }}
          >
            Content Studio
          </div>
          <h1
            className="mt-4.5 text-5xl font-800 leading-tight tracking-tight max-w-sm"
            style={{ color: '#fff', margin: '18px 0 0' }}
          >
            The backend that runs{' '}
            <span style={{ color: 'var(--green-500)' }}>mepm.co.uk</span>
          </h1>
          <p
            className="mt-5 text-base leading-relaxed max-w-sm"
            style={{ color: 'rgba(255,255,255,.66)' }}
          >
            Manage projects, enquiries, the team and every word on the website
            — then preview it live before it ships.
          </p>
        </div>

        <div
          className="font-mono text-xs tracking-widest"
          style={{ color: 'rgba(255,255,255,.4)' }}
        >
          MEPM Building Services Consultants · Internal tool
        </div>
      </div>

      {/* Sign-in */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-sm">
          <h2
            className="font-display text-3.5xl font-800 text-navy-800 m-0"
            style={{ fontSize: '28px' }}
          >
            Sign in
          </h2>
          <p
            className="font-body text-base text-slate-600 mt-2 mb-6.5"
            style={{ marginTop: '8px', marginBottom: '26px' }}
          >
            Enter your admin credentials.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="username"
                className="block font-mono text-xs tracking-widest uppercase text-slate-500 mb-1.75"
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-300 rounded-md font-body text-base bg-white focus:border-navy-600 focus:shadow-[0_0_0_3px_rgba(0,64,120,0.1)] outline-none transition-all duration-120"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-xs tracking-widest uppercase text-slate-500 mb-1.75"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-300 rounded-md font-body text-base bg-white focus:border-navy-600 focus:shadow-[0_0_0_3px_rgba(0,64,120,0.1)] outline-none transition-all duration-120"
              />
            </div>

            {error && (
              <p
                className="text-sm font-body mt-2"
                style={{ color: 'var(--danger)' }}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              iconRight="ArrowRight"
              disabled={busy}
              style={{ width: '100%', marginTop: '22px' }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
