import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

async function checkAuth() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('admin-authenticated');
  return authenticated?.value === 'true';
}

export async function POST(req: Request) {
  if (!await checkAuth()) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await req.json();

  const { error } = await supabase
    .from('stories')
    .insert([data]);

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true });
}