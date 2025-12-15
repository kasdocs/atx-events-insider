import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

async function checkAuth() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('admin-authenticated');
  return authenticated?.value === 'true';
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  if (!await checkAuth()) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const params = await props.params;
  const data = await req.json();
  const id = params.id;

  const { error } = await supabase
    .from('stories')
    .update(data)
    .eq('id', id);

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  if (!await checkAuth()) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const params = await props.params;
  const id = params.id;

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true });
}