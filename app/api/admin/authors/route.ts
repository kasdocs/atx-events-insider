import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-authenticated')?.value === 'true';
}

export async function GET() {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/admin/authors error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error('GET /api/admin/authors exception:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => null);

    const name = String(body?.name || '').trim();
    const slug = String(body?.slug || '').trim();
    const bio = body?.bio ?? null;
    const favorite_event_type = body?.favorite_event_type ?? null;
    const avatar_url = body?.avatar_url ?? null;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('authors')
      .insert([
        {
          name,
          slug,
          bio,
          favorite_event_type,
          avatar_url,
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('POST /api/admin/authors error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/admin/authors exception:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
