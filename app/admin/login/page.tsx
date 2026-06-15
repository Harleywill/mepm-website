'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace('/admin/enquiries');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed');
        setBusy(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const input =
    'w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60 focus:border-navy-300 transition-colors';

  return (
    <div className="bp-grid-light flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mepm-spec text-green-700">MEPM · Admin</span>
          <h1 className="mepm-h2 mt-2 text-navy-700">Sign in</h1>
        </div>
        <form
          onSubmit={submit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-navy-700"
          >
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className={input}
          />
          <label
            htmlFor="password"
            className="mb-1.5 mt-4 block text-sm font-medium text-navy-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={input}
          />
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
