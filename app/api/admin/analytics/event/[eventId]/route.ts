import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-authenticated')?.value === 'true';
}

function safeNum(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function parseEventIdFromUrl(req: Request): number | null {
  const url = new URL(req.url);
  // path like /api/admin/analytics/event/123
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('event');
  const raw = idx >= 0 ? parts[idx + 1] : null;
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

export async function GET(req: Request) {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const eventId = parseEventIdFromUrl(req);
    if (!eventId) return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 });

    const admin = createSupabaseAdminClient();

    // 1) Basic event info
    const { data: ev, error: evErr } = await admin
      .from('events')
      .select('id, slug, title')
      .eq('id', eventId)
      .maybeSingle();

    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // 2) Popularity (from your view)
    const { data: pop, error: popErr } = await (admin as any)
      .from('event_popularity')
      .select('unique_viewers, total_views, last_viewed_at')
      .eq('event_id', eventId)
      .maybeSingle();

    if (popErr) return NextResponse.json({ error: popErr.message }, { status: 500 });

    const unique_viewers = safeNum(pop?.unique_viewers);
    const total_views = safeNum(pop?.total_views);
    const last_viewed_at = typeof pop?.last_viewed_at === 'string' ? pop.last_viewed_at : null;

    // 3) Totals for saves + going (count locally to avoid relying on group-by)
    const [savesRes, goingRes] = await Promise.all([
      admin.from('saved_events').select('event_id').eq('event_id', eventId),
      admin.from('event_rsvps').select('event_id').eq('event_id', eventId).eq('status', 'going'),
    ]);

    if (savesRes.error) return NextResponse.json({ error: savesRes.error.message }, { status: 500 });
    if (goingRes.error) return NextResponse.json({ error: goingRes.error.message }, { status: 500 });

    const saves = Array.isArray(savesRes.data) ? savesRes.data.length : 0;
    const going = Array.isArray(goingRes.data) ? goingRes.data.length : 0;

    // 4) Outbound click totals (sum daily rows)
    const { data: daily, error: dailyErr } = await (admin as any)
      .from('event_analytics_daily')
      .select('day, outbound_clicks, outbound_clicks_instagram, outbound_clicks_ticket')
      .eq('event_id', eventId)
      .order('day', { ascending: false })
      .limit(60);

    if (dailyErr) return NextResponse.json({ error: dailyErr.message }, { status: 500 });

    let outbound_clicks = 0;
    let instagram_clicks = 0;
    let ticket_clicks = 0;

    const daily_rows = Array.isArray(daily)
      ? daily.map((r: any) => {
          const row = {
            day: typeof r?.day === 'string' ? r.day : null,
            outbound_clicks: safeNum(r?.outbound_clicks),
            instagram_clicks: safeNum(r?.outbound_clicks_instagram),
            ticket_clicks: safeNum(r?.outbound_clicks_ticket),
          };

          outbound_clicks += row.outbound_clicks;
          instagram_clicks += row.instagram_clicks;
          ticket_clicks += row.ticket_clicks;

          return row;
        })
      : [];

    return NextResponse.json(
      {
        event: { id: ev.id, slug: ev.slug ?? null, title: ev.title ?? null },
        popularity: { unique_viewers, total_views, last_viewed_at },
        engagement: { saves, going, outbound_clicks, instagram_clicks, ticket_clicks },
        daily_rows,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
