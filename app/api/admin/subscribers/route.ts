import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { Database } from '@/lib/database.types';

type SubscriberRow = Database['public']['Tables']['newsletter_subscribers']['Row'];

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-authenticated')?.value === 'true';
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
    .returns<SubscriberRow[]>();

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const body = (await req.json()) as { id?: unknown };

  const idNum =
    typeof body.id === 'number'
      ? body.id
      : typeof body.id === 'string'
        ? Number(body.id)
        : NaN;

  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', idNum);


  return NextResponse.json({ success: true });
}
