'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type SavedRow = Database['public']['Tables']['saved_events']['Row'];

export default function SaveEventButton({ eventId }: { eventId: number }) {
  const router = useRouter();
  const pathname = usePathname();

  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Create Supabase client only after mount (browser-only)
  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient() as SupabaseClient<Database>;
      setSupabase(client);
    } catch (err) {
      console.error('Supabase browser client init failed:', err);
      setSupabase(null);
      setUserId(null);
      setIsSaved(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const refresh = async (uid: string | null) => {
      setUserId(uid);

      if (!uid) {
        if (!cancelled) {
          setIsSaved(false);
          setLoading(false);
        }
        return;
      }

      const { data: savedRow, error } = await supabase
        .from('saved_events')
        .select('id')
        .eq('user_id', uid)
        .eq('event_id', eventId)
        .maybeSingle()
        .returns<Pick<SavedRow, 'id'> | null>();

      if (cancelled) return;

      if (error) console.error('saved_events lookup error:', error);

      setIsSaved(Boolean(savedRow));
      setLoading(false);
    };

    const init = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error) console.error('auth.getUser error:', error);

      await refresh(data.user?.id ?? null);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      refresh(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [eventId, supabase]);

  const onClick = async () => {
    if (loading) return;

    const returnTo = encodeURIComponent(pathname ?? '/');

    if (!supabase) {
      router.push(`/login?returnTo=${returnTo}`);
      return;
    }

    if (!userId) {
      router.push(`/login?returnTo=${returnTo}`);
      return;
    }

    setLoading(true);

    if (isSaved) {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) console.error('saved_events delete error:', error);
      else setIsSaved(false);
    } else {
      const payload: Database['public']['Tables']['saved_events']['Insert'] = {
        user_id: userId,
        event_id: eventId,
      };

      const { error } = await supabase.from('saved_events').insert(payload);

      if (error) console.error('saved_events insert error:', error);
      else setIsSaved(true);
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 text-center font-semibold rounded-lg border-2 transition-colors hover:bg-purple-50 disabled:opacity-60"
      style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
    >
      {loading ? '...' : isSaved ? '✅ Saved' : '🔖 Save Event'}
    </button>
  );
}
