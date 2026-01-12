'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

type CostFilter = 'all' | 'free' | 'free_rsvp' | 'paid';

type FeaturedApiRow = {
  id: string;
  event_id: number;
  rank: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  events: Pick<EventRow, 'id'> | null;
};

type FeaturedApiResponse = {
  featured: FeaturedApiRow[];
};

export default function BrowseContent() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Going counts by event id
  const [goingCountsByEventId, setGoingCountsByEventId] = useState<Record<number, number>>({});

  // ✅ Featured event ids
  const [featuredIds, setFeaturedIds] = useState<Set<number>>(new Set());

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<CostFilter>('all');

  // Mobile filter collapse state
  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Detect mobile and set default collapse behavior:
  // - mobile: start collapsed
  // - md+: always open
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768; // Tailwind md breakpoint
      setIsMobile(mobile);
      setFiltersOpen(!mobile);
    };

    update();
    window.addEventListener('resize', update);

    return () => window.removeEventListener('resize', update);
  }, []);

  // Pull initial filters from URL (?date=, etc.)
  useEffect(() => {
    const date = searchParams.get('date') ?? '';
    if (date) setSelectedDate(date);
  }, [searchParams]);

  // ✅ Fetch featured ids (public route)
  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedIds = async () => {
      try {
        const res = await fetch('/api/featured', { cache: 'no-store' });
        if (!res.ok) return;

        const json = (await res.json()) as FeaturedApiResponse;
        const ids = (json.featured ?? [])
          .map((row) => row.events?.id)
          .filter((id): id is number => typeof id === 'number');

        if (!cancelled) setFeaturedIds(new Set(ids));
      } catch {
        // silent fail - browse still works
      }
    };

    fetchFeaturedIds();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchEventsAndCounts = async () => {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', today) // ✅ hide past events
        .order('event_date', { ascending: true })
        .returns<EventRow[]>();

      if (cancelled) return;

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        setGoingCountsByEventId({});
        setLoading(false);
        return;
      }

      const eventRows = data ?? [];
      setEvents(eventRows);

      const ids = eventRows
        .map((e) => e.id)
        .filter((id): id is number => typeof id === 'number');

      if (ids.length === 0) {
        setGoingCountsByEventId({});
        setLoading(false);
        return;
      }

      // ✅ Bulk fetch "going" rows and count client-side
      const { data: rsvpRows, error: rsvpErr } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .in('event_id', ids)
        .eq('status', 'going');

      if (cancelled) return;

      if (rsvpErr) {
        console.error('Error fetching going counts:', rsvpErr);
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
    };

    fetchEventsAndCounts();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const neighborhoods = Array.from(
    new Set(events.map((e) => e.neighborhood).filter((v): v is string => !!v))
  ).sort();

  const eventTypes = Array.from(
    new Set(events.map((e) => e.event_type).filter((v): v is string => !!v))
  ).sort();

  const filteredEvents = events.filter((e) => {
    const d = e.event_date ?? '';

    if (selectedDate && d !== selectedDate) return false;

    if (selectedNeighborhood !== 'all' && e.neighborhood !== selectedNeighborhood) return false;

    if (selectedType !== 'all' && e.event_type !== selectedType) return false;

    if (selectedCost !== 'all') {
      const pricing = e.pricing_type ?? '';
      if (selectedCost === 'free' && pricing !== 'Free') return false;
      if (selectedCost === 'free_rsvp' && pricing !== 'Free with RSVP') return false;
      if (selectedCost === 'paid' && (pricing === 'Free' || pricing === 'Free with RSVP'))
        return false;
    }

    return true;
  });

  // --- Sticky date grouping helpers ---
  const groupedByDate = filteredEvents.reduce<Record<string, EventRow[]>>((acc, ev) => {
    const key = ev.event_date ?? '';
    if (!key) return acc;
    (acc[key] ??= []).push(ev);
    return acc;
  }, {});

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => a.localeCompare(b));

  const formatDateHeading = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };
  // -------------------------------

  const activeFilterCount = () => {
    let count = 0;
    if (selectedDate) count += 1;
    if (selectedNeighborhood !== 'all') count += 1;
    if (selectedType !== 'all') count += 1;
    if (selectedCost !== 'all') count += 1;
    return count;
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedNeighborhood('all');
    setSelectedType('all');
    setSelectedCost('all');
  };

  const timeToMinutes = (t?: string | null) => {
    if (!t) return 24 * 60 + 1;

    const s = t.trim();

    // 24h or "HH:MM:SS"
    const m24 = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m24) {
      const hh = Number(m24[1]);
      const mm = Number(m24[2]);
      return hh * 60 + mm;
    }

    // "h:mm AM/PM"
    const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
      let hh = Number(m12[1]);
      const mm = Number(m12[2]);
      const ap = m12[3].toUpperCase();
      if (ap === 'PM' && hh !== 12) hh += 12;
      if (ap === 'AM' && hh === 12) hh = 0;
      return hh * 60 + mm;
    }

    return 24 * 60 + 1;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-3" style={{ color: '#7B2CBF' }}>
            Browse Events
          </h1>
          <p className="text-xl text-gray-600">Find the perfect event for you in Austin</p>
        </div>
      </div>

      {/* Organizer CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 flex items-center justify-between gap-6">
          <div>
            <div className="text-xl font-bold mb-1" style={{ color: '#7B2CBF' }}>
              Event Organizer?
            </div>
            <div className="text-gray-600">Get your event featured on ATX Events Insider</div>
          </div>
          <a
            href="/submit-event"
            className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#FF006E' }}
          >
            Submit Your Event →
          </a>
        </div>
      </div>

      {/* Filters Row */}
      <div className="border-b border-gray-200 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Mobile controls */}
          <div className="flex items-center justify-between gap-3 mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              {filtersOpen ? 'Hide filters' : 'Show filters'}
              {activeFilterCount() > 0 ? ` (${activeFilterCount()})` : ''}
            </button>

            {activeFilterCount() > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            ) : null}
          </div>

          {/* On desktop (md+): always visible. On mobile: collapsible */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
                  📅 Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Neighborhood */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
                  📍 Neighborhood
                </label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Neighborhoods</option>
                  {neighborhoods.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
                  🎭 Event Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
                  💸 Cost
                </label>
                <select
                  value={selectedCost}
                  onChange={(e) => setSelectedCost(e.target.value as CostFilter)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Events</option>
                  <option value="free">Free</option>
                  <option value="free_rsvp">Free with RSVP</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Desktop clear row */}
            <div className="hidden md:flex justify-end mt-4">
              {activeFilterCount() > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  Clear filters ({activeFilterCount()})
                </button>
              ) : null}
            </div>
          </div>

          {/* Mobile collapsed summary */}
          {!filtersOpen && isMobile ? (
            <div className="md:hidden text-sm text-gray-600">
              {activeFilterCount() > 0
                ? `Filters applied: ${activeFilterCount()}`
                : 'No filters applied'}
            </div>
          ) : null}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-gray-600">Loading events...</div>
        ) : (
          <>
            <div className="text-gray-600 mb-6">Showing {filteredEvents.length} events</div>

            {filteredEvents.length === 0 ? (
              <div className="text-gray-600">No events match your filters.</div>
            ) : (
              <div className="space-y-10">
                {dateKeys.map((dateKey) => {
                  const eventsForDate = groupedByDate[dateKey] ?? [];

                  const sortedForDate = eventsForDate.slice().sort((a, b) => {
                    const aFeat = typeof a.id === 'number' && featuredIds.has(a.id) ? 1 : 0;
                    const bFeat = typeof b.id === 'number' && featuredIds.has(b.id) ? 1 : 0;

                    // featured first
                    if (aFeat !== bFeat) return bFeat - aFeat;

                    // then sort by time
                    const aTime = timeToMinutes(a.time);
                    const bTime = timeToMinutes(b.time);
                    if (aTime !== bTime) return aTime - bTime;

                    // stable fallback
                    return (a.title ?? '').localeCompare(b.title ?? '');
                  });

                  return (
                    <section key={dateKey} className="space-y-6">
                      {/* Sticky Date Header */}
                      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
                        <div className="py-4">
                          <h2 className="text-3xl font-bold" style={{ color: '#7B2CBF' }}>
                            {formatDateHeading(dateKey)}
                          </h2>
                        </div>
                      </div>

                      {/* Events for this date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedForDate.map((event) => {
                          const isFeatured =
                            typeof event.id === 'number' ? featuredIds.has(event.id) : false;

                          return (
                            <EventCard
                              key={event.id}
                              event={event}
                              goingCount={
                                typeof event.id === 'number'
                                  ? (goingCountsByEventId[event.id] ?? 0)
                                  : 0
                              }
                              featured={isFeatured}
                            />
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
