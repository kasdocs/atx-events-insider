'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';

type EventRow = Database['public']['Tables']['events']['Row'];
type SavedRow = Database['public']['Tables']['saved_events']['Row'];

export default function SavedEventsPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.error('auth.getUser error:', userErr);

      const user = userData.user;

      if (!user) {
        router.push('/login?returnTo=/saved');
        return;
      }

      const { data: savedRows, error: savedErr } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedErr) console.error('saved_events query error:', savedErr);

      const ids = (savedRows ?? []).map((r) => r.event_id);

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
        .in('id', ids);

      if (eventsErr) console.error('events query error:', eventsErr);

      if (!cancelled) {
        const map = new Map((eventRows ?? []).map((e) => [e.id, e]));
        const ordered = ids
  .map((id) => map.get(id))
  .filter((e): e is EventRow => Boolean(e));

setEvents(ordered);

        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
