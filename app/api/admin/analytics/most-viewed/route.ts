import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

function parseIntParam(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseSort(v: string | null): 'unique' | 'total' {
  const s = (v ?? '').toLowerCase().trim();
  return s === 'total' ? 'total' : 'unique';
}

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-authenticated')?.value === 'true';
}

type PopularityBaseRow = {
  event_id: number;
  slug: string | null;
  title: string | null;
  unique_viewers: number | null;
  total_views: number | null;
  last_viewed_at: string | null;
};

export async function GET(req: Request) {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const url = new URL(req.url);
    const sort = parseSort(url.searchParams.get('sort'));
    const limit = Math.min(Math.max(parseIntParam(url.searchParams.get('limit'), 10), 1), 100);

    const admin = createSupabaseAdminClient();

    // 1) Base popularity list from the view you already have
    const { data: popularityUnknown, error: popErr } = (await (admin as any)
      .from('event_popularity')
      .select('event_id, slug, title, unique_viewers, total_views, last_viewed_at')
      .order(sort === 'unique' ? 'unique_viewers' : 'total_views', { ascending: false })
      .order(sort === 'unique' ? 'total_views' : 'unique_viewers', { ascending: false })
      .limit(limit)) as { data: unknown; error: { message: string } | null };

    if (popErr) return NextResponse.json({ error: popErr.message }, { status: 500 });

    const popularity: PopularityBaseRow[] = Array.isArray(popularityUnknown)
      ? (popularityUnknown as PopularityBaseRow[])
      : [];

    const eventIds = popularity.map((r) => r.event_id).filter((id) => Number.isFinite(id));

    if (eventIds.length === 0) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // 2) Engagement totals
    const [dailyRes, savesRes, goingRes] = await Promise.all([
      (admin as any)
        .from('event_analytics_daily')
        .select('event_id, outbound_clicks, outbound_clicks_instagram, outbound_clicks_ticket')
        .in('event_id', eventIds),

      // Pull only event_id rows and count locally
      admin.from('saved_events').select('event_id').in('event_id', eventIds),

      admin.from('event_rsvps').select('event_id').in('event_id', eventIds).eq('status', 'going'),
    ]);

    const clicksByEvent = new Map<number, { outbound_clicks: number; instagram_clicks: number; ticket_clicks: number }>();

    if (!dailyRes.error && Array.isArray(dailyRes.data)) {
      for (const row of dailyRes.data as Array<any>) {
        const id = Number(row?.event_id);
        if (!Number.isFinite(id)) continue;

        const prev = clicksByEvent.get(id) ?? { outbound_clicks: 0, instagram_clicks: 0, ticket_clicks: 0 };

        prev.outbound_clicks += Number(row?.outbound_clicks ?? 0) || 0;
        prev.instagram_clicks += Number(row?.outbound_clicks_instagram ?? 0) || 0;
        prev.ticket_clicks += Number(row?.outbound_clicks_ticket ?? 0) || 0;

        clicksByEvent.set(id, prev);
      }
    }

    const savesByEvent = new Map<number, number>();
    if (!savesRes.error && Array.isArray(savesRes.data)) {
      for (const row of savesRes.data as Array<any>) {
        const id = Number(row?.event_id);
        if (!Number.isFinite(id)) continue;
        savesByEvent.set(id, (savesByEvent.get(id) ?? 0) + 1);
      }
    }

    const goingByEvent = new Map<number, number>();
    if (!goingRes.error && Array.isArray(goingRes.data)) {
      for (const row of goingRes.data as Array<any>) {
        const id = Number(row?.event_id);
        if (!Number.isFinite(id)) continue;
        goingByEvent.set(id, (goingByEvent.get(id) ?? 0) + 1);
      }
    }

    // 3) Shape final response (UI expects { items })
    const items = popularity.map((r) => {
      const clicks = clicksByEvent.get(r.event_id) ?? { outbound_clicks: 0, instagram_clicks: 0, ticket_clicks: 0 };

      return {
        event_id: r.event_id,
        slug: r.slug,
        title: r.title,
        unique_viewers: r.unique_viewers ?? 0,
        total_views: r.total_views ?? 0,
        last_viewed_at: r.last_viewed_at,

        outbound_clicks: clicks.outbound_clicks,
        instagram_clicks: clicks.instagram_clicks,
        ticket_clicks: clicks.ticket_clicks,

        saves: savesByEvent.get(r.event_id) ?? 0,
        going: goingByEvent.get(r.event_id) ?? 0,
      };
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
