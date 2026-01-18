'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type RSVPRow = Database['public']['Tables']['event_rsvps']['Row'];

function isAuthSessionMissingError(err: unknown) {
  const anyErr = err as any;
  return !!anyErr && anyErr.name === 'AuthSessionMissingError';
}

export default function RSVPWidget({
  eventId,
  returnTo,
}: {
  eventId: number;
  returnTo: string;
}) {
  const router = useRouter();

  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient() as SupabaseClient<Database>;
      setSupabase(client);
    } catch (err) {
      console.error(err);
      setSupabase(null);
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isGoing, setIsGoing] = useState(false);
  const [goingCount, setGoingCount] = useState(0);

  const refreshCount = async (client: SupabaseClient<Database> | null) => {
    if (!client) {
      setGoingCount(0);
      return;
    }

    const { count, error } = await client
      .from('event_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'going');

    if (error) console.error('Going count error:', error);
    setGoingCount(count ?? 0);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // Guard
      if (!supabase) {
        if (!cancelled) {
          setIsGoing(false);
          setGoingCount(0);
          setLoading(false);
        }
        return;
      }

      // counts show for everyone
      await refreshCount(supabase);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr) {
        if (!isAuthSessionMissingError(sessionErr)) {
          console.error('getSession error:', sessionErr);
        }
        if (!cancelled) {
          setIsGoing(false);
          setLoading(false);
        }
        return;
      }

      const user = sessionData.session?.user ?? null;

      if (!user) {
        if (!cancelled) {
          setIsGoing(false);
          setLoading(false);
        }
        return;
      }

      const { data: existing, error: rsvpErr } = await supabase
        .from('event_rsvps')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle()
        .returns<Pick<RSVPRow, 'id' | 'status'> | null>();

      if (rsvpErr) console.error('Load going state error:', rsvpErr);

      if (!cancelled) {
        setIsGoing(existing?.status === 'going');
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [eventId, supabase]);

  const requireLogin = () => {
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const toggleGoing = async () => {
    if (saving) return;

    setSaving(true);

    try {
      // Guard
      if (!supabase) {
        requireLogin();
        return;
      }

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr) {
        if (!isAuthSessionMissingError(sessionErr)) {
          console.error('getSession error:', sessionErr);
        }
        requireLogin();
        return;
      }

      const user = sessionData.session?.user ?? null;

      if (!user) {
        requireLogin();
        return;
      }

      // If already going -> delete
      if (isGoing) {
        const { error } = await supabase
          .from('event_rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('status', 'going');

        if (error) {
          console.error('Un-go error:', error);
          return;
        }

        setIsGoing(false);
        await refreshCount(supabase);
        router.refresh();
        return;
      }

      // Else -> upsert going
      const { error } = await supabase.from('event_rsvps').upsert({
        user_id: user.id,
        event_id: eventId,
        status: 'going',
      });

      if (error) {
        console.error('Going upsert error:', error);
        return;
      }

      setIsGoing(true);
      await refreshCount(supabase);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-bold" style={{ color: '#7B2CBF' }}>
          Going?
        </div>

        <div className="text-xs text-gray-600">👥 {goingCount} going</div>
      </div>

      <button
        type="button"
        onClick={toggleGoing}
        disabled={loading || saving}
        className={`w-full py-3 rounded-lg font-semibold border transition-opacity ${
          isGoing ? 'text-white' : 'bg-white text-gray-800 border-gray-200'
        } ${loading || saving ? 'opacity-60' : 'hover:opacity-90'}`}
        style={isGoing ? { backgroundColor: '#06D6A0', borderColor: '#06D6A0' } : {}}
      >
        {isGoing ? '✅ You’re going' : '✅ I’m going'}
      </button>

      <div className="text-xs text-gray-600 mt-3">Not an official RSVP.</div>
    </div>
  );
}
