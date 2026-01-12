import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { Database } from '@/lib/database.types';

type EventInsert = Database['public']['Tables']['events']['Insert'];

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-authenticated')?.value === 'true';
}

export async function GET() {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) {
      console.error('GET /api/admin/events Supabase error:', error);
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('GET /api/admin/events crashed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const supabase = createSupabaseAdminClient();

    const raw = (await req.json()) as Partial<EventInsert>;

    const asString = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const asOptionalString = (v: unknown) => {
      const s = asString(v);
      return s.length ? s : undefined;
    };

    // Required fields (these were the ones TS complained about being string-only)
    const title = asString(raw.title);
    const event_date = asString(raw.event_date);
    const location = asString(raw.location);
    const event_type = asString(raw.event_type);
    const pricing_type = asString(raw.pricing_type);

    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    if (!event_date) return NextResponse.json({ error: 'Event date is required.' }, { status: 400 });
    if (!location) return NextResponse.json({ error: 'Location is required.' }, { status: 400 });
    if (!event_type) return NextResponse.json({ error: 'Event type is required.' }, { status: 400 });
    if (!pricing_type) return NextResponse.json({ error: 'Pricing type is required.' }, { status: 400 });

    const payload: EventInsert = {
      title,
      event_date,
      location,
      event_type,
      pricing_type,

      // Optional strings (use undefined, not null)
      slug: asOptionalString(raw.slug),
      time: asOptionalString(raw.time),
      instagram_url: asOptionalString(raw.instagram_url),
      description: asOptionalString(raw.description),
      neighborhood: asOptionalString(raw.neighborhood),
      insider_tip: asOptionalString(raw.insider_tip),
      image_url: asOptionalString(raw.image_url),

      // Optional number
      price: typeof raw.price === 'number' ? raw.price : undefined,

      // text[] (keep only if your DB column is text[])
      vibe: Array.isArray(raw.vibe) ? (raw.vibe as any) : undefined,
    };

    const { data, error } = await supabase.from('events').insert(payload).select('id').single();

    if (error) {
      console.error('POST /api/admin/events Supabase error:', error);
      console.error('POST /api/admin/events payload:', payload);

      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('POST /api/admin/events crashed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
