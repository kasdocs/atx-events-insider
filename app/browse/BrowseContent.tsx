'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

type CostFilter = 'all' | 'free' | 'free_rsvp' | 'paid';

export default function BrowseContent() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<CostFilter>('all');

  // Pull initial filters from URL (?date=, etc.)
  useEffect(() => {
    const date = searchParams.get('date') ?? '';
    if (date) setSelectedDate(date);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .returns<EventRow[]>();

      if (cancelled) return;

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } else {
        setEvents(data ?? []);
      }

      setLoading(false);
    };

    fetchEvents();

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
      if (selectedCost === 'paid' && (pricing === 'Free' || pricing === 'Free with RSVP')) return false;
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
                {dateKeys.map((dateKey) => (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groupedByDate[dateKey].map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
