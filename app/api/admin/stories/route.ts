import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';

async function checkAuth() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('admin-authenticated');
  return authenticated?.value === 'true';
}

export async function POST(req: Request) {
  if (!(await checkAuth())) return new NextResponse('Unauthorized', { status: 401 });

  const supabase = createSupabaseServerAnonClient();
  const payload = await req.json();

  const { error } = await supabase.from('stories').insert(payload);

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  return NextResponse.json({ success: true });
}
