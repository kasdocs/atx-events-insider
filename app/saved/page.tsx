'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';

type EventRow = Database['public']['Tables']['events']['Row'];
type SavedRow = Pick<
  Database['public']['Tables']['saved_events']['Row'],
  'event_id' | 'created_at'
>;

export default function SavedEventsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.error('getUser error:', userErr);

      const user = userData.user;

      if (!user) {
        router.push('/login?returnTo=/saved');
        return;
      }

      const { data: savedRows, error: savedErr } = await supabase
        .from('saved_events')
        .select('event_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<SavedRow[]>();

      if (savedErr) console.error('saved_events query error:', savedErr);

      const ids = (savedRows ?? [])
        .map((r) => r.event_id)
        .filter((id): id is number => typeof id === 'number');

      if (ids.length === 0) {
        if (!cancelled) {
          setEvents([]);
          setLoading(false);
        }
        return;
      }

      const { data: eventRows, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .in('id', ids)
        .returns<EventRow[]>();

      if (eventsErr) console.error('events query error:', eventsErr);

      if (!cancelled) {
        const map = new Map((eventRows ?? []).map((e) => [e.id, e]));
        setEvents(ids.map((id) => map.get(id)).filter(Boolean) as EventRow[]);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#7B2CBF' }}>
          Saved Events
        </h1>

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-600">No saved events yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
