'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SaveEventButton({ eventId }: { eventId: number }) {
  const router = useRouter();
  const pathname = usePathname();

  // Important: create ONE client instance per component mount
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error) console.error('auth.getUser error:', error);

      const uid = data.user?.id ?? null;
      if (cancelled) return;

      setUserId(uid);

      if (!uid) {
        setIsSaved(false);
        setLoading(false);
        return;
      }

      const { data: savedRow, error: savedErr } = await supabase
        .from('saved_events')
        .select('id')
        .eq('user_id', uid)
        .eq('event_id', eventId)
        .maybeSingle();

      if (savedErr) console.error('saved_events select error:', savedErr);
      if (cancelled) return;

      setIsSaved(!!savedRow);
      setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [eventId, supabase]);

  const onClick = async () => {
    if (loading) return;

    if (!userId) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
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
      const { error } = await supabase
        .from('saved_events')
        .insert({ user_id: userId, event_id: eventId });

      if (error) console.error('saved_events insert error:', error);
      else setIsSaved(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 text-center font-semibold rounded-lg border-2 transition-colors hover:bg-purple-50 disabled:opacity-60"
      style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
    >
      {loading ? '...' : isSaved ? '✅ Saved' : '🔖 Save Event'}
    </button>
  );
}
