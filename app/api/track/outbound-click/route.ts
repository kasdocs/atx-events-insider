import { NextResponse } from 'next/server';
import { createSupabaseServerServiceClient } from '@/lib/supabase-server';

function getHeader(req: Request, name: string) {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase()) ?? null;
}

function normalizeKind(v: unknown): 'instagram' | 'ticket' | 'other' {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (s === 'instagram') return 'instagram';
  if (s === 'ticket') return 'ticket';
  return 'other';
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerServiceClient();

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const event_id = Number(body?.event_id);
    if (!Number.isFinite(event_id) || event_id <= 0) {
      return NextResponse.json({ error: 'event_id must be a positive number' }, { status: 400 });
    }

    const href = typeof body?.href === 'string' && body.href.trim().length > 0 ? body.href.trim() : null;
    if (!href) {
      return NextResponse.json({ error: 'href is required' }, { status: 400 });
    }

    const kind = normalizeKind(body?.kind);

    const pathname =
      typeof body?.pathname === 'string' && body.pathname.trim().length > 0 ? body.pathname.trim() : null;

    const referrer =
      typeof body?.referrer === 'string' && body.referrer.trim().length > 0
        ? body.referrer.trim()
        : getHeader(req, 'referer');

    const viewer_id = typeof body?.viewer_id === 'string' ? body.viewer_id : null;
    const session_id = typeof body?.session_id === 'string' ? body.session_id : null;

    if (!viewer_id || !session_id) {
      return NextResponse.json({ error: 'viewer_id and session_id are required (uuid strings)' }, { status: 400 });
    }

    // 1) Insert raw event
    // This assumes your `event_analytics_events` table exists as shown in your screenshots.
    // If your column names differ, tell me and I will adjust the insert shape.
    const insertRes = await (supabase as any).from('event_analytics_events').insert({
      event_id,
      event_name: 'outbound_click',
      viewer_id,
      session_id,
      referrer,
      pathname,
      meta: { kind, href },
    });

    if (insertRes?.error) {
      return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
    }

    // 2) Increment daily aggregates in event_analytics_daily
    // Your screenshot shows these columns:
    // - outbound_clicks
    // - outbound_clicks_ticket
    // - outbound_clicks_instagram
    const today = new Date();
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      .toISOString()
      .slice(0, 10);

    const patch: Record<string, number> = {
      outbound_clicks: 1,
    };
    if (kind === 'instagram') patch.outbound_clicks_instagram = 1;
    if (kind === 'ticket') patch.outbound_clicks_ticket = 1;

    const upsertRes = await (supabase as any)
      .from('event_analytics_daily')
      .upsert(
        {
          day,
          event_id,
          ...patch,
        },
        { onConflict: 'day,event_id' }
      );

    if (upsertRes?.error) {
      // Do not fail the whole request if the aggregate upsert fails.
      // The raw event is still valuable.
      console.error('outbound-click daily upsert error:', upsertRes.error);
    }

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
