import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

async function checkAuth() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('admin-authenticated');
  return authenticated?.value === 'true';
}

export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  console.log('POST /api/admin/events called');
  
  if (!await checkAuth()) {
    console.log('Auth failed');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await req.json();
  console.log('Received data:', data);

  const { error } = await supabase
    .from('events')
    .insert([data]);

  if (error) {
    console.error('Supabase error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log('Event created successfully');
  return NextResponse.json({ success: true });
}