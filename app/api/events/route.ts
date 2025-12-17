import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      slug,
      event_date,
      time,
      location,
      image_url,
      description,
      pricing_type,
      price,
      instagram_url,
      insider_tip,
      event_type,
      subtype_1,
      subtype_2,
      subtype_3,
      neighborhood,
      vibe
    `)
    .order('event_date', { ascending: true });

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Normalize vibe so the frontend always gets an array
  const normalized = (data ?? []).map((e: any) => ({
    ...e,
    vibe: Array.isArray(e?.vibe) ? e.vibe : [],
  }));

  return NextResponse.json(normalized);
}
