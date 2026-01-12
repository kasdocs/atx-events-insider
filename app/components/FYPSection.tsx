'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import EventCard from '@/app/components/EventCard';

type EventRow = Database['public']['Tables']['events']['Row'];
type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

type Vibe = NonNullable<EventRow['vibe']>[number];

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

function toVibes(value: unknown): Vibe[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is Vibe => typeof v === 'string' && v.length > 0) as Vibe[];
}

function scoreEventForUser(event: EventRow, prefs: PrefRow) {
  let score = 0;

  const favType = (prefs.favorite_event_type ?? '').trim();
  const favHood = (prefs.favorite_neighborhood ?? '').trim();

  const favVibes = toVibes(prefs.favorite_vibes);
  const eventVibes = toVibes(event.vibe);

  if (favType && event.event_type && event.event_type === favType) score += 100;

  if (favVibes.length && eventVibes.length) {
    const vibeSet = new Set<Vibe>(eventVibes);
    let matches = 0;
    for (const v of favVibes) {
      if (vibeSet.has(v)) matches += 1;
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
  const vibes = toVibes(prefs.favorite_vibes);
  const hasVibes = vibes.length > 0;
  return hasType || hasHood || hasVibes;
}

export default function FYPSection({
  events,
  goingCountsByEventId,
}: {
  events: EventRow[];
  goingCountsByEventId?: Record<number, number>;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [fypEvents, setFypEvents] = useState<EventRow[]>([]);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setShowCTA(false);

      // ✅ Guard: supabase can be null if env vars are missing
      if (!supabase) {
        if (!cancelled) {
          setFypEvents([]);
          setShowCTA(false);
          setLoading(false);
        }
        return;
      }

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) console.error('FYP getSession error:', sessionErr);

      const user = sessionData.session?.user ?? null;

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
        .maybeSingle();

      if (prefErr) console.error('FYP preferences error:', prefErr);

      const prefsObj = (prefs as PrefRow | null) ?? null;

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

          const favVibes = toVibes(prefsObj.favorite_vibes);
          const eventVibes = toVibes(event.vibe);

          const typeMatch = favType && event.event_type === favType;
          const hoodMatch = favHood && event.neighborhood === favHood;

          let vibeMatch = false;
          if (favVibes.length && eventVibes.length) {
            const vibeSet = new Set<Vibe>(eventVibes);
            vibeMatch = favVibes.some((v) => vibeSet.has(v));
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
        setShowCTA(finalList.length === 0);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [events, supabase]);

  if (loading) return null;

  if (showCTA && fypEvents.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
          🎯 For You
        </h2>

        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="text-gray-700 mb-3">Set your favorites to get a personalized “For You” feed.</p>

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

  if (fypEvents.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-8" style={{ color: '#7B2CBF' }}>
        🎯 For You
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fypEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            goingCount={typeof event.id === 'number' ? (goingCountsByEventId?.[event.id] ?? 0) : 0}
          />
        ))}
      </div>
    </div>
  );
}
