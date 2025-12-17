import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';

async function checkAuth() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('admin-authenticated');
  return authenticated?.value === 'true';
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

  const supabase = createSupabaseServerAnonClient();
  const params = await props.params;

  const id = Number(params.id);
  const payload = await req.json();

  const { error } = await supabase.from('stories').update(payload).eq('id', id);

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

  const supabase = createSupabaseServerAnonClient();
  const params = await props.params;

  const id = Number(params.id);

  const { error } = await supabase.from('stories').delete().eq('id', id);

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  return NextResponse.json({ success: true });
}
