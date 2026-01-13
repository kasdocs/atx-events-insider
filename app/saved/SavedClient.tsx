'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function SavedClient() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Supabase client only after mount (browser-only).
  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      setSupabase(client);
      setErrorMsg(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Supabase is not configured.';
      setSupabase(null);
      setErrorMsg(msg);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // TODO: fetch saved events here using supabase
        // Example placeholder:
        // const { data, error } = await supabase.from('saved_events').select('*');
        // if (error) throw error;

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load saved events.';
        if (!cancelled) setErrorMsg(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-10 text-gray-600">Loading...</div>;
  }

  if (errorMsg) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
          {errorMsg}
        </div>
      </div>
    );
  }

  return <div className="max-w-6xl mx-auto px-4 py-10">Saved content here</div>;
}
