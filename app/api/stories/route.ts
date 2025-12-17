import { NextResponse } from 'next/server';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createSupabaseServerAnonClient();

  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('published_date', { ascending: false });

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
