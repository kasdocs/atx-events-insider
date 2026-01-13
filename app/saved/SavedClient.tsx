'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import EventCard from '@/app/components/EventCard';

type SavedRow = Database['public']['Tables']['saved_events']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

export default function SavedClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<number[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [goingCountsByEventId, setGoingCountsByEventId] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) Get user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) console.error('SavedClient auth.getUser error:', userErr);

        const uid = userData.user?.id ?? null;
        if (cancelled) return;

        setUserId(uid);

        if (!uid) {
          setSavedEventIds([]);
          setEvents([]);
          setGoingCountsByEventId({});
          setLoading(false);
          return;
        }

        // 2) Get saved event ids
        const { data: savedRows, error: savedErr } = await supabase
          .from('saved_events')
          .select('event_id, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .returns<Pick<SavedRow, 'event_id' | 'created_at'>[]>();

        if (savedErr) {
          console.error('SavedClient saved_events select error:', savedErr);
          throw new Error('Could not load your saved events.');
        }

        const ids = (savedRows ?? [])
          .map((r) => r.event_id)
          .filter((v): v is number => typeof v === 'number');

        if (cancelled) return;

        setSavedEventIds(ids);

        if (ids.length === 0) {
          setEvents([]);
          setGoingCountsByEventId({});
          setLoading(false);
          return;
        }

        // 3) Fetch events (use * to match EventCard expectations and avoid schema mismatch)
        const { data: eventRows, error: eventsErr } = await supabase
          .from('events')
          .select('*')
          .in('id', ids)
          .returns<EventRow[]>();

        if (eventsErr) {
          console.error('SavedClient events select error:', eventsErr);
          throw new Error('Could not load saved event details.');
        }

        // Keep saved order
        const byId = new Map((eventRows ?? []).map((e) => [e.id, e] as const));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as EventRow[];

        if (cancelled) return;

        setEvents(ordered);

        // 4) Fetch going counts for these events
        const { data: rsvpRows, error: rsvpErr } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .in('event_id', ids)
          .eq('status', 'going');

        if (rsvpErr) {
          console.error('SavedClient going counts error:', rsvpErr);
          setGoingCountsByEventId({});
        } else {
          const counts: Record<number, number> = {};
          for (const row of rsvpRows ?? []) {
            const id = (row as { event_id: number | null }).event_id;
            if (typeof id === 'number') counts[id] = (counts[id] ?? 0) + 1;
          }
          setGoingCountsByEventId(counts);
        }

        setLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load saved events.';
        if (!cancelled) {
          setErrorMsg(msg);
          setLoading(false);
        }
      }
    };

    load();

    // Reload on auth change
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-600">Loading…</div>;
  }

  if (errorMsg) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">{errorMsg}</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold" style={{ color: '#7B2CBF' }}>
          Saved
        </h1>
        <p className="mt-2 text-gray-600">Log in to see your saved events.</p>

        <button
          onClick={() => router.push('/login?returnTo=%2Fsaved')}
          className="mt-6 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FF006E' }}
        >
          Log in →
        </button>
      </div>
    );
  }

  if (savedEventIds.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold" style={{ color: '#7B2CBF' }}>
          Saved
        </h1>
        <p className="mt-2 text-gray-600">
          You have not saved any events yet. Tap “Save Event” on an event to add it here.
        </p>

        <Link
          href="/browse"
          className="inline-flex mt-6 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FF006E' }}
        >
          Browse events →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#7B2CBF' }}>
            Saved
          </h1>
          <p className="mt-2 text-gray-600">Your saved events ({events.length})</p>
        </div>

        <Link
          href="/browse"
          className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FF006E' }}
        >
          Browse more →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            goingCount={typeof event.id === 'number' ? (goingCountsByEventId[event.id] ?? 0) : 0}
            featured={false}
          />
        ))}
      </div>
    </div>
  );
}
