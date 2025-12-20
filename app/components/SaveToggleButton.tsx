'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SaveToggleButton({ eventId }: { eventId: number }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        if (!cancelled) {
          setUserId(null);
          setIsSaved(false);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setUserId(user.id);

      const { data, error } = await supabase
        .from('saved_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) console.error('SaveToggleButton check error:', error);

      if (!cancelled) {
        setIsSaved(Boolean(data));
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [eventId, supabase]);

  const onToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent the EventCard Link from navigating
    e.preventDefault();
    e.stopPropagation();

    if (saving) return;

    // If logged out, send them to login and bring them back
    if (!userId) {
      const returnTo = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?returnTo=${returnTo}`;
      return;
    }

    setSaving(true);

    if (isSaved) {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) {
        console.error('unsave error:', error);
      } else {
        setIsSaved(false);
      }
    } else {
      const { error } = await supabase.from('saved_events').insert({
        user_id: userId,
        event_id: eventId,
      });

      if (error) {
        console.error('save error:', error);
      } else {
        setIsSaved(true);
      }
    }

    setSaving(false);
  };

  // Don’t show anything until we know state, avoids UI flicker
  if (loading) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isSaved ? 'Unsave event' : 'Save event'}
      className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm border transition-opacity ${
        isSaved
          ? 'bg-white border-purple-200'
          : 'bg-white/95 border-gray-200 hover:opacity-90'
      } ${saving ? 'opacity-60' : ''}`}
      title={isSaved ? 'Saved' : 'Save'}
    >
      {/* Heart icon */}
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 ${isSaved ? 'text-purple-700' : 'text-gray-700'}`}
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 21s-7-4.35-9.5-8.28C.96 9.78 2.1 6.9 4.76 5.8c1.7-.7 3.7-.25 5.04 1.1L12 9.1l2.2-2.2c1.34-1.35 3.34-1.8 5.04-1.1 2.66 1.1 3.8 3.98 2.26 6.92C19 16.65 12 21 12 21z" />
      </svg>
    </button>
  );
}
