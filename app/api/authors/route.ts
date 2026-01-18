import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error('Missing Supabase env vars');
  return createClient(url, anon);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('authors')
      .select('id, name, slug, bio, favorite_event_type, avatar_url, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('GET /api/authors error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e: any) {
    console.error('GET /api/authors exception:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
