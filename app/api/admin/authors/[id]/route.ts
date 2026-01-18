import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-authenticated')?.value === 'true';
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const id = String(params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => null);

    const payload: Record<string, any> = {};
    if (body?.name !== undefined) payload.name = String(body.name || '').trim();
    if (body?.slug !== undefined) payload.slug = String(body.slug || '').trim();
    if (body?.bio !== undefined) payload.bio = body.bio ?? null;
    if (body?.favorite_event_type !== undefined) payload.favorite_event_type = body.favorite_event_type ?? null;
    if (body?.avatar_url !== undefined) payload.avatar_url = body.avatar_url ?? null;

    if (payload.name !== undefined && !payload.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (payload.slug !== undefined && !payload.slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('authors')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`PUT /api/admin/authors/${id} error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('PUT /api/admin/authors/[id] exception:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

    const id = String(params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from('authors').delete().eq('id', id);

    if (error) {
      console.error(`DELETE /api/admin/authors/${id} error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE /api/admin/authors/[id] exception:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
