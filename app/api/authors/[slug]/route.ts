import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error('Missing Supabase env vars');
  return createClient(url, anon);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;
    const cleaned = (slug || '').trim();

    if (!cleaned) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

    const supabase = getSupabase();

    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, name, slug, bio, favorite_event_type, avatar_url, created_at')
      .eq('slug', cleaned)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, slug, excerpt, cover_image, published_date, story_type, featured')
      .eq('author_id', author.id)
      .order('published_date', { ascending: false });

    if (storiesError) {
      console.error('GET /api/authors/[slug] stories error:', storiesError);
      return NextResponse.json({ error: storiesError.message }, { status: 500 });
    }

    return NextResponse.json({
      author,
      stories: Array.isArray(stories) ? stories : [],
    });
  } catch (e: any) {
    console.error('GET /api/authors/[slug] exception:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
