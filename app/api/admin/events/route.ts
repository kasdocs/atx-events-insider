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

    // Only allow fields that exist on the table (prevents random form keys)
    const payload: EventInsert = {
      title: raw.title ?? null,
      slug: raw.slug ?? null,
      event_date: raw.event_date ?? null,
      time: raw.time ?? null,
      location: raw.location ?? null,
      instagram_url: raw.instagram_url ?? null,
      description: raw.description ?? null,
      event_type: raw.event_type ?? null,
      neighborhood: raw.neighborhood ?? null,
      pricing_type: raw.pricing_type ?? null,
      price: raw.price ?? null,
      insider_tip: raw.insider_tip ?? null,
      image_url: raw.image_url ?? null,
      vibe: (Array.isArray(raw.vibe) ? raw.vibe : null) as any, // keep if your column is text[]
    };

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select('id')
      .single();

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
