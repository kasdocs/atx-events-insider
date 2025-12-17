'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

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
          Create account
        </h1>

        <form onSubmit={onSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
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
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
          </div>

          {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

          <button
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90"
            style={{ backgroundColor: '#7B2CBF' }}
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)}
            className="w-full py-3 rounded-lg border-2 font-semibold hover:bg-purple-50"
            style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
