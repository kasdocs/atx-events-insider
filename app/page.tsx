export const dynamic = 'force-dynamic';

import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import Sidebar from './components/Sidebar';
import FeaturedStoryHero from '@/app/components/FeaturedStoryHero';
import FYPSection from '@/app/components/FYPSection';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';
import { getBaseUrl } from '@/lib/get-base-url';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

type FeaturedApiRow = {
  id: string;
  event_id: number;
  rank: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  events: Pick<
    EventRow,
    | 'id'
    | 'title'
    | 'slug'
    | 'event_date'
    | 'time'
    | 'location'
    | 'neighborhood'
    | 'event_type'
    | 'vibe'
    | 'pricing_type'
    | 'price'
    | 'image_url'
    | 'description'
    | 'instagram_url'
    | 'insider_tip'
    | 'subtype_1'
    | 'subtype_2'
    | 'subtype_3'
  > | null;
};

type FeaturedApiResponse = {
  featured: FeaturedApiRow[];
};

export default async function Home() {
  const supabase = createSupabaseServerAnonClient();

  const today = new Date().toISOString().split('T')[0];

  const getNextWeekend = () => {
    const now = new Date();
    const currentDay = now.getDay();

    const daysUntilFriday = currentDay <= 5 ? 5 - currentDay : 5 + (7 - currentDay);

    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(nextFriday);
    nextSunday.setDate(nextFriday.getDate() + 2);
    nextSunday.setHours(23, 59, 59, 999);

    return {
      friday: nextFriday.toISOString().split('T')[0],
      sunday: nextSunday.toISOString().split('T')[0],
    };
  };

  const weekend = getNextWeekend();

  // 1) Fetch all upcoming events (used for FYP + Free This Weekend)
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, created_at, title, slug, event_date, time, location, image_url, description, pricing_type, price, instagram_url, insider_tip, event_type, subtype_1, subtype_2, subtype_3, neighborhood, vibe'
    )
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .returns<EventRow[]>();

  if (error) console.error('Error fetching events:', error);

  const events: EventRow[] = data ?? [];

  const freeEvents = events.filter((event) => {
    const eventDate = event.event_date ?? '';
    const isFreeOrRSVP = event.pricing_type === 'Free' || event.pricing_type === 'Free with RSVP';
    const isWeekend = eventDate >= weekend.friday && eventDate <= weekend.sunday;
    return isFreeOrRSVP && isWeekend;
  });

  // 2) Fetch featured events (ranked) from your public API route
  let featuredEvents: EventRow[] = [];
  try {
    const res = await fetch(`${getBaseUrl()}/api/featured`, { cache: 'no-store' });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Error fetching featured events:', res.status, errText);
    } else {
      const json = (await res.json()) as FeaturedApiResponse;

      featuredEvents = (json.featured ?? [])
        .map((row) => row.events)
        .filter((e): e is EventRow => !!e);
    }
  } catch (e) {
    console.error('Error fetching featured events:', e);
  }

  // Optional: remove featured items from Free This Weekend to avoid duplicates
  const featuredIds = new Set(featuredEvents.map((e) => e.id));
  const freeEventsDeduped = freeEvents.filter((e) => !featuredIds.has(e.id));

  // --- Bulk fetch "going" counts for all events actually shown on homepage ---
  const eventIds = Array.from(
    new Set(
      [...events, ...freeEventsDeduped, ...featuredEvents]
        .map((e) => e.id)
        .filter((id): id is number => typeof id === 'number')
    )
  );

  let goingCountsByEventId: Record<number, number> = {};

  if (eventIds.length > 0) {
    const { data: rsvpRows, error: rsvpErr } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'going');

    if (rsvpErr) {
      console.error('Error fetching going counts:', rsvpErr);
    } else {
      const counts: Record<number, number> = {};
      for (const row of rsvpRows ?? []) {
        const id = (row as { event_id: number | null }).event_id;
        if (typeof id === 'number') counts[id] = (counts[id] ?? 0) + 1;
      }
      goingCountsByEventId = counts;
    }
  }
  // --------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <FeaturedStoryHero />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
            Discover Austin&apos;s Best Events
          </h1>
          <p className="text-xl text-gray-600">Curated by Kas, your local events insider</p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - 70% */}
          <div className="lg:col-span-8">
            {/* For You Section */}
            <FYPSection events={events} goingCountsByEventId={goingCountsByEventId} />

            {/* Free This Weekend Section */}
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#FF006E' }}>
              🎟️ Free This Weekend
            </h2>

            {freeEventsDeduped.length > 0 ? (
              <div className="mb-12">
                <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-2">
                  {freeEventsDeduped.map((event) => (
                    <div key={event.id} className="snap-start min-w-[85%] md:min-w-0">
                      <EventCard
                        event={event}
                        goingCount={typeof event.id === 'number' ? goingCountsByEventId[event.id] ?? 0 : 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 mb-12">No free events found. Check back soon!</p>
            )}

            {/* Featured Events Section */}
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#7B2CBF' }}>
              🔥 Featured Events
            </h2>

            {featuredEvents.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-2">
                {featuredEvents.map((event) => (
                  <div key={`featured-${event.id}`} className="snap-start min-w-[85%] md:min-w-0">
                    <EventCard
                      event={event}
                      goingCount={typeof event.id === 'number' ? goingCountsByEventId[event.id] ?? 0 : 0}
                      featured
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No featured events yet. Add some in the admin dashboard.</p>
            )}
          </div>

          {/* Sidebar - 30% */}
          <div className="lg:col-span-4">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
