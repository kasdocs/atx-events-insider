import { NextResponse } from 'next/server';
import { createSupabaseServerServiceClient } from '@/lib/supabase-server';

function getHeader(req: Request, name: string) {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase()) ?? null;
}

function getClientIp(req: Request) {
  // Best-effort IP extraction (not required by your DB function, but handy if you want it later)
  const xff = getHeader(req, 'x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;

  const xri = getHeader(req, 'x-real-ip');
  if (xri) return xri;

  return null;
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

    const p_pathname =
      typeof body?.pathname === 'string' && body.pathname.trim().length > 0
        ? body.pathname.trim()
        : null;

    // Optional referrer: prefer body.referrer, fallback to request header
    const p_referrer =
      typeof body?.referrer === 'string' && body.referrer.trim().length > 0
        ? body.referrer.trim()
        : getHeader(req, 'referer');

    // Viewer + session IDs
    // - viewer_id: stable per device/user (store in localStorage/cookie)
    // - session_id: per browsing session (store in sessionStorage)
    const p_viewer_id = typeof body?.viewer_id === 'string' ? body.viewer_id : null;
    const p_session_id = typeof body?.session_id === 'string' ? body.session_id : null;

    if (!p_viewer_id || !p_session_id) {
      return NextResponse.json(
        { error: 'viewer_id and session_id are required (uuid strings)' },
        { status: 400 }
      );
    }

    // Your DB function expects exactly these parameter names.
    const payload = {
      p_event_id: event_id,
      p_viewer_id,
      p_session_id,
      p_referrer,
      p_pathname,
    };

    // If your generated DB types do not include Functions.track_event_view yet,
    // TypeScript will complain. Cast to any to avoid the "never" error.
    const { error } = await (supabase as any).rpc('track_event_view', payload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 204 = success with no body
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// Optional: if you want to support quick manual testing in browser without POST,
// you can enable GET. If you do not want this, delete the GET handler.
export async function GET() {
  return NextResponse.json({ ok: true });
}
