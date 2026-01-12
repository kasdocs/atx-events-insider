'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const supabase = useMemo(() => {
  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // ✅ Guard: TS + runtime safety if env vars are missing
    if (!supabase) {
      setErrorMsg('Auth is not configured. Missing Supabase env vars.');
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push(returnTo);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
          Log in
        </h1>

        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

          <button
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#7B2CBF' }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/signup?returnTo=${encodeURIComponent(returnTo)}`)}
            className="w-full py-3 rounded-lg border-2 font-semibold hover:bg-purple-50"
            style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}
