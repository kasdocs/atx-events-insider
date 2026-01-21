import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server'; // adjust if needed

type CookieJar = Awaited<ReturnType<typeof cookies>>;
type HeaderBag = Awaited<ReturnType<typeof headers>>;

async function getOrSetCookie(jar: CookieJar, name: string, ttlSeconds: number) {
  const existing = jar.get(name)?.value;
  if (existing) return existing;

  const v = randomUUID();
  jar.set({
    name,
    value: v,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: ttlSeconds,
  });
  return v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const eventId = Number(body?.event_id);
    const pathname = typeof body?.pathname === 'string' ? body.pathname : null;

    if (!eventId || Number.isNaN(eventId)) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const jar = await cookies();
    const h: HeaderBag = await headers();

    const viewerId = await getOrSetCookie(jar, 'ae_viewer', 60 * 60 * 24 * 30); // 30 days
    const sessionId = await getOrSetCookie(jar, 'ae_sess', 60 * 60 * 24); // 24h
    const referrer = h.get('referer');

    const supabase = await createSupabaseServerAnonClient();

    // Your generated types likely don’t include this RPC yet, so TS thinks rpc() only accepts known names.
    // Casting rpc to "any" keeps it unblocked for now. Later we’ll regenerate types cleanly.
    const { error } = await (supabase as any).rpc('track_event_view', {
      p_event_id: eventId,
      p_viewer_id: viewerId,
      p_session_id: sessionId,
      p_referrer: referrer,
      p_pathname: pathname,
    });

if (error) {
  console.error('track_event_view rpc error:', error);
  return NextResponse.json(
    { message: 'track_event_view failed', error },
    { status: 500 }
  );
}

    return new NextResponse(null, { status: 204 });
} catch (err) {
  console.error('analytics view route error:', err);
  return NextResponse.json(
    { message: 'analytics view route crashed', error: String(err) },
    { status: 500 }
  );
}

}
