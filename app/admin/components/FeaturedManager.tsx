'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatEventLabel, formatVibeLabel } from '../lib/adminUtils';

type EventRow = Database['public']['Tables']['events']['Row'];
type FeaturedRow = Database['public']['Tables']['featured_events']['Row'];

type FeaturedWithEvent = FeaturedRow & {
  events: Pick<
    EventRow,
    | 'id'
    | 'title'
    | 'slug'
    | 'event_date'
    | 'location'
    | 'neighborhood'
    | 'event_type'
    | 'pricing_type'
    | 'price'
    | 'time'
    | 'image_url'
    | 'vibe'
  > | null;
};

export default function FeaturedManager() {
  const supabase = useMemo(() => {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<FeaturedWithEvent[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [rank, setRank] = useState<number>(1);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setErr(null);

    const [{ data: featuredData, error: featuredError }, { data: eventsData, error: eventsError }] =
      await Promise.all([
        supabase
          .from('featured_events')
          .select(
            `
            id,
            event_id,
            rank,
            is_active,
            starts_at,
            ends_at,
            created_at,
            updated_at,
            events:events (
              id,
              title,
              slug,
              event_date,
              location,
              neighborhood,
              event_type,
              pricing_type,
              price,
              time,
              image_url,
              vibe
            )
          `
          )
          .order('rank', { ascending: true })
          .returns<FeaturedWithEvent[]>(),
        supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false })
          .returns<EventRow[]>(),
      ]);

    if (featuredError) setErr(featuredError.message);
    if (eventsError) setErr((prev) => prev ?? eventsError.message);

    setFeatured(featuredData ?? []);
    setEvents(eventsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAddFeatured = async () => {
    setErr(null);

    if (!selectedEventId) {
      setErr('Pick an event first.');
      return;
    }

    const { error } = await supabase.from('featured_events').insert({
      event_id: selectedEventId,
      rank,
      is_active: true,
      starts_at: null,
      ends_at: null,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    setSelectedEventId('');
    setRank(1);
    await loadAll();
  };

  const onToggleActive = async (row: FeaturedWithEvent) => {
    setErr(null);

    const { error } = await supabase
      .from('featured_events')
      .update({ is_active: !row.is_active })
      .eq('id', row.id);

    if (error) {
      setErr(error.message);
      return;
    }

    await loadAll();
  };

  const onUpdateRank = async (rowId: string, newRank: number) => {
    setErr(null);

    const { error } = await supabase.from('featured_events').update({ rank: newRank }).eq('id', rowId);

    if (error) {
      setErr(error.message);
      return;
    }

    await loadAll();
  };

  const onRemove = async (rowId: string) => {
    setErr(null);

    const { error } = await supabase.from('featured_events').delete().eq('id', rowId);

    if (error) {
      setErr(error.message);
      return;
    }

    await loadAll();
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Featured Manager</h2>
          <p className="text-sm text-gray-600">
            Add events to the featured list and control their rank and active status.
          </p>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-7">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Pick an event</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Select an event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {formatEventLabel(ev)}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Rank</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={rank}
            min={1}
            onChange={(e) => setRank(Number(e.target.value || 1))}
          />
        </div>

        <div className="lg:col-span-3">
          <button
            onClick={onAddFeatured}
            className="w-full rounded-lg bg-purple-700 text-white text-sm font-semibold px-4 py-2 hover:opacity-95"
          >
            Add to Featured
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Current featured</h3>

        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : featured.length === 0 ? (
          <div className="text-sm text-gray-600">No featured events yet.</div>
        ) : (
          <div className="space-y-3">
            {featured.map((row) => {
              const ev = row.events;

              // IMPORTANT: Treat vibe as string[] to avoid union mismatches like "munchies"
              const vibeArr: string[] = Array.isArray(ev?.vibe) ? (ev!.vibe as unknown as string[]) : [];

              return (
                <div key={row.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {ev?.title ?? '(Missing event)'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ev?.slug ? `/events/${ev.slug}` : ''}{' '}
                        {ev?.event_date ? `• ${ev.event_date}` : ''}
                        {ev?.location ? ` • ${ev.location}` : ''}
                      </div>

                      {vibeArr.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {vibeArr.slice(0, 6).map((v) => (
                            <span
                              key={v}
                              className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                              title={v}
                            >
                              {formatVibeLabel(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => onToggleActive(row)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          row.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {row.is_active ? 'Active' : 'Inactive'}
                      </button>

                      <button
                        onClick={() => onRemove(row.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-xs text-gray-600">Rank</div>
                    <input
                      type="number"
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      value={row.rank}
                      min={1}
                      onChange={(e) => onUpdateRank(row.id, Number(e.target.value || 1))}
                    />
                    <div className="text-xs text-gray-500">Lower number shows first</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
