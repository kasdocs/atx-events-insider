'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import EventCard from '@/app/components/EventCard';

type EventRow = Database['public']['Tables']['events']['Row'];
type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

function parseDateKey(dateStr: string | null) {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const [y, m, d] = dateStr.split('-').map((x) => Number(x));
  const t = new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function uniqueById(events: EventRow[]) {
  const seen = new Set<number>();
  const out: EventRow[] = [];
  for (const e of events) {
    if (typeof e.id !== 'number') continue;
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

function scoreEventForUser(event: EventRow, prefs: PrefRow) {
  let score = 0;

  const favType = (prefs.favorite_event_type ?? '').trim();
  const favHood = (prefs.favorite_neighborhood ?? '').trim();
  const favVibes = Array.isArray(prefs.favorite_vibes) ? prefs.favorite_vibes : [];

  if (favType && event.event_type && event.event_type === favType) score += 100;

  if (favVibes.length && Array.isArray(event.vibe)) {
    const vibeSet = new Set(event.vibe);
    let matches = 0;
    for (const v of favVibes) {
      if (v && vibeSet.has(v)) matches += 1;
    }
    score += matches * 10;
  }

  if (favHood && event.neighborhood && event.neighborhood === favHood) score += 1;

  return score;
}

function hasAnyPrefs(prefs: PrefRow | null) {
  if (!prefs) return false;
  const hasType = Boolean((prefs.favorite_event_type ?? '').trim());
  const hasHood = Boolean((prefs.favorite_neighborhood ?? '').trim());
  const vibes = Array.isArray(prefs.favorite_vibes) ? prefs.favorite_vibes : [];
  const hasVibes = vibes.filter(Boolean).length > 0;
  return hasType || hasHood || hasVibes;
}

export default function FYPSection({ events }: { events: EventRow[] }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [fypEvents, setFypEvents] = useState<EventRow[]>([]);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setShowCTA(false);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.error('FYP getUser error:', userErr);

      const user = userData.user;
      if (!user) {
        if (!cancelled) {
          setFypEvents([]);
          setShowCTA(false);
          setLoading(false);
        }
        return;
      }

      const { data: prefs, error: prefErr } = await supabase
        .from('user_preferences')
        .select('user_id, created_at, favorite_event_type, favorite_neighborhood, favorite_vibes')
        .eq('user_id', user.id)
        .maybeSingle<PrefRow>();

      if (prefErr) console.error('FYP preferences error:', prefErr);

      const prefsObj = prefs ?? null;

      // Logged in but no prefs set yet: show CTA
      if (!prefsObj || !hasAnyPrefs(prefsObj)) {
        if (!cancelled) {
          setFypEvents([]);
          setShowCTA(true);
          setLoading(false);
        }
        return;
      }

      const scored = events
        .map((e) => ({
          event: e,
          dateKey: parseDateKey(e.event_date),
          score: scoreEventForUser(e, prefsObj),
        }))
        .filter(({ event }) => {
          const favType = (prefsObj.favorite_event_type ?? '').trim();
          const favHood = (prefsObj.favorite_neighborhood ?? '').trim();
          const favVibes = Array.isArray(prefsObj.favorite_vibes) ? prefsObj.favorite_vibes : [];

          const typeMatch = favType && event.event_type === favType;
          const hoodMatch = favHood && event.neighborhood === favHood;

          let vibeMatch = false;
          if (favVibes.length && Array.isArray(event.vibe)) {
            const vibeSet = new Set(event.vibe);
            vibeMatch = favVibes.some((v) => v && vibeSet.has(v));
          }

          return Boolean(typeMatch || vibeMatch || hoodMatch);
        })
        .sort((a, b) => {
          if (a.dateKey !== b.dateKey) return a.dateKey - b.dateKey;
          return b.score - a.score;
        })
        .map((x) => x.event);

      const finalList = uniqueById(scored).slice(0, 6);

      if (!cancelled) {
        setFypEvents(finalList);
        setShowCTA(finalList.length === 0); // if nothing matched, prompt them too
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [events, supabase]);

  if (loading) return null;

  // CTA for logged-in users who have no prefs (or no matches)
  if (showCTA && fypEvents.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
          🎯 For You
        </h2>

        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="text-gray-700 mb-3">
            Set your favorites to get a personalized “For You” feed.
          </p>

          <Link
            href="/saved"
            className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#7B2CBF' }}
          >
            Choose favorites →
          </Link>
        </div>
      </div>
    );
  }

  // No FYP and no CTA means: not logged in or no data
  if (fypEvents.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-8" style={{ color: '#7B2CBF' }}>
        🎯 For You
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fypEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
