'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';

type EventRow = Database['public']['Tables']['events']['Row'];
type SavedRow = Pick<Database['public']['Tables']['saved_events']['Row'], 'event_id' | 'created_at'>;

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

const EVENT_TYPE_OPTIONS: string[] = [
  'Music',
  'Food & Drink',
  'Art & Culture',
  'Nightlife',
  'Sports & Fitness',
  'Market',
  'Community',
  'Comedy',
  'Festival',
  'Film & Theater',
  'Wellness',
  'Political & Activism',
  'Networking & Social',
  'Coffee & Tea',
  'Education & Workshops',
  'Outdoors & Nature',
];

const NEIGHBORHOOD_OPTIONS: string[] = [
  'Downtown',
  'East Austin',
  'South Austin',
  'North Austin',
  'West Austin',
  'Central',
  'Rainey Street',
  '6th Street',
  'Domain',
  'Mueller',
  'Zilker',
  'Other',
];

const VIBE_GROUPS: Array<{
  category: string;
  vibes: Array<{ value: string; label: string }>;
}> = [
  {
    category: 'Social energy',
    vibes: [
      { value: 'good_for_groups', label: 'Good for Groups' },
      { value: 'meet_people', label: 'Meet People' },
      { value: 'date_night', label: 'Date Night' },
      { value: 'family_friendly', label: 'Family Friendly' },
      { value: 'kid_friendly', label: 'Kid Friendly' },
      { value: 'pet_friendly', label: 'Pet Friendly' },
    ],
  },
  {
    category: 'Intensity',
    vibes: [
      { value: 'low_key', label: 'Low Key' },
      { value: 'high_energy', label: 'High Energy' },
      { value: 'chill', label: 'Chill' },
      { value: 'cozy', label: 'Cozy' },
    ],
  },
  {
    category: 'Music and nightlife feel',
    vibes: [
      { value: 'dancey', label: 'Dancey' },
      { value: 'live_music', label: 'Live Music' },
      { value: 'dj_set', label: 'DJ Set' },
      { value: 'late_night', label: 'Late Night' },
    ],
  },
  {
    category: 'Taste and treats',
    vibes: [
      { value: 'food_trucks_nearby', label: 'Food Trucks Nearby' },
      { value: 'for_the_foodies', label: 'For the Foodies' },
      { value: 'coffee_hang', label: 'Coffee Hang' },
      { value: 'dessert_run', label: 'Dessert Run' },
    ],
  },
  {
    category: 'Outdoors and movement',
    vibes: [
      { value: 'outdoor_hang', label: 'Outdoor Hang' },
      { value: 'sweat_level_light', label: 'Sweat Level: Light' },
      { value: 'sweat_level_real', label: 'Sweat Level: Real' },
    ],
  },
  {
    category: 'Culture and creative',
    vibes: [
      { value: 'artsy', label: 'Artsy' },
      { value: 'makers', label: 'Makers' },
      { value: 'diy', label: 'DIY' },
      { value: 'nerdy', label: 'Nerdy' },
      { value: 'vintage', label: 'Vintage' },
      { value: 'thrifty', label: 'Thrifty' },
    ],
  },
  {
    category: 'Wellness',
    vibes: [
      { value: 'grounding', label: 'Grounding' },
      { value: 'soft_morning', label: 'Soft Morning' },
      { value: 'beginner_friendly', label: 'Beginner Friendly' },
    ],
  },
  {
    category: 'Civic and political',
    vibes: [
      { value: 'civic_action', label: 'Civic Action' },
      { value: 'protest', label: 'Protest' },
    ],
  },
];

const formatInternalLabel = (value: string) => {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const VIBE_LABEL_BY_VALUE: Record<string, string> = VIBE_GROUPS.reduce((acc, group) => {
  for (const v of group.vibes) acc[v.value] = v.label;
  return acc;
}, {} as Record<string, string>);

export default function SavedEventsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  const [favoriteEventType, setFavoriteEventType] = useState<string>('');
  const [favoriteNeighborhood, setFavoriteNeighborhood] = useState<string>('');
  const [favoriteVibes, setFavoriteVibes] = useState<string[]>([]);

  const [favoritesOpen, setFavoritesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setPrefsLoading(true);
      setPrefsMsg(null);

      // ✅ Guard
      if (!supabase) {
        router.push('/login?returnTo=/saved');
        return;
      }

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) console.error('getSession error:', sessionErr);

      const user = sessionData.session?.user ?? null;

      if (!user) {
        router.push('/login?returnTo=/saved');
        return;
      }

      if (!cancelled) setUserId(user.id);

      // 1) Load preferences
      const { data: prefData, error: prefErr } = await supabase
        .from('user_preferences')
        .select('user_id, created_at, favorite_event_type, favorite_neighborhood, favorite_vibes')
        .eq('user_id', user.id)
        .maybeSingle<PrefRow>();

      if (prefErr) console.error('user_preferences query error:', prefErr);

      if (!cancelled) {
        setFavoriteEventType(prefData?.favorite_event_type ?? '');
        setFavoriteNeighborhood(prefData?.favorite_neighborhood ?? '');
        setFavoriteVibes(prefData?.favorite_vibes ?? []);
        setPrefsLoading(false);
      }

      // 2) Load saved events
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

  const toggleVibe = (value: string) => {
    setPrefsMsg(null);
    setFavoriteVibes((prev) => {
      const exists = prev.includes(value);
      if (exists) return prev.filter((v) => v !== value);
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  };

  const savePreferences = async () => {
    if (!userId) return;

    // ✅ Guard
    if (!supabase) {
      setPrefsMsg('Auth is not configured. Missing Supabase env vars.');
      return;
    }

    setPrefsSaving(true);
    setPrefsMsg(null);

    const payload: Database['public']['Tables']['user_preferences']['Insert'] = {
      user_id: userId,
      favorite_event_type: favoriteEventType || null,
      favorite_neighborhood: favoriteNeighborhood || null,
      favorite_vibes: favoriteVibes.length ? favoriteVibes : [],
    };

    const { error } = await supabase.from('user_preferences').upsert(payload);

    if (error) {
      console.error('user_preferences upsert error:', error);
      setPrefsMsg('Could not save preferences. Please try again.');
      setPrefsSaving(false);
      return;
    }

    setPrefsMsg('Preferences saved. Your For You feed will update on the homepage.');
    setPrefsSaving(false);
  };

  const favoritesSelectedCount =
    (favoriteEventType ? 1 : 0) + (favoriteNeighborhood ? 1 : 0) + favoriteVibes.length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#7B2CBF' }}>
          Saved Events
        </h1>

        <div className="border border-gray-200 rounded-xl p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#7B2CBF' }}>
                Your Favorites
              </h2>
              <div className="text-sm text-gray-600 mt-1">
                Save your favorites to build your <span className="font-semibold">For You</span> feed
                on the homepage.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFavoritesOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
                aria-expanded={favoritesOpen}
                aria-controls="favorites-panel"
              >
                <span>
                  {favoritesOpen ? 'Hide favorites' : 'Set favorites'}
                  {favoritesSelectedCount > 0 ? ` (${favoritesSelectedCount})` : ''}
                </span>

                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    favoritesOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={savePreferences}
                disabled={prefsLoading || prefsSaving || !userId}
                className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#7B2CBF' }}
              >
                {prefsSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {!favoritesOpen && !prefsLoading ? (
            <div className="mt-4 text-sm text-gray-700">
              {favoritesSelectedCount === 0 ? (
                <span>No favorites selected yet.</span>
              ) : (
                <span>
                  Current favorites:{' '}
                  <span className="font-semibold">
                    {favoriteEventType ? `Type: ${favoriteEventType}` : ''}
                    {favoriteEventType && (favoriteNeighborhood || favoriteVibes.length) ? ' • ' : ''}
                    {favoriteNeighborhood ? `Neighborhood: ${favoriteNeighborhood}` : ''}
                    {favoriteNeighborhood && favoriteVibes.length ? ' • ' : ''}
                    {favoriteVibes.length ? `Vibes: ${favoriteVibes.length}` : ''}
                  </span>
                </span>
              )}
            </div>
          ) : null}

          <div id="favorites-panel" className={favoritesOpen ? 'mt-5' : 'hidden'}>
            {prefsLoading ? (
              <div className="text-gray-600">Loading preferences...</div>
            ) : (
              <>
                {prefsMsg ? <div className="text-sm text-gray-700 mb-4">{prefsMsg}</div> : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
                      🎭 Favorite Event Type
                    </label>
                    <select
                      value={favoriteEventType}
                      onChange={(e) => {
                        setPrefsMsg(null);
                        setFavoriteEventType(e.target.value);
                      }}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="">No favorite selected</option>
                      {EVENT_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
                      📍 Favorite Neighborhood
                    </label>
                    <select
                      value={favoriteNeighborhood}
                      onChange={(e) => {
                        setPrefsMsg(null);
                        setFavoriteNeighborhood(e.target.value);
                      }}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="">No favorite selected</option>
                      {NEIGHBORHOOD_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-semibold" style={{ color: '#7B2CBF' }}>
                      ✨ Favorite Vibes (pick up to 3)
                    </label>
                    <div className="text-xs text-gray-600">Selected: {favoriteVibes.length}/3</div>
                  </div>

                  {favoriteVibes.length ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {favoriteVibes.map((v) => (
                        <span
                          key={v}
                          className="px-3 py-1.5 rounded-full text-sm border border-purple-200 bg-purple-50 text-purple-800"
                        >
                          {VIBE_LABEL_BY_VALUE[v] ?? formatInternalLabel(v)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {VIBE_GROUPS.map((group) => (
                      <div key={group.category} className="border border-gray-200 rounded-xl p-4">
                        <div className="font-semibold mb-3" style={{ color: '#7B2CBF' }}>
                          {group.category}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.vibes.map((v) => {
                            const selected = favoriteVibes.includes(v.value);
                            const disabled = !selected && favoriteVibes.length >= 3;

                            return (
                              <button
                                key={v.value}
                                type="button"
                                onClick={() => toggleVibe(v.value)}
                                disabled={disabled}
                                className={`px-3 py-1.5 rounded-full text-sm border transition-opacity ${
                                  selected
                                    ? 'border-purple-400 bg-purple-50 text-purple-800'
                                    : 'border-gray-200 bg-white text-gray-700'
                                } ${disabled ? 'opacity-50' : ''}`}
                              >
                                {v.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {favoriteVibes.length >= 3 ? (
                    <div className="text-xs text-gray-600 mt-3">
                      Max selected. Unselect one to choose a different vibe.
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

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
