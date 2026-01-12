import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing Supabase URL env var');
  if (!key) throw new Error('Missing Supabase key env var');

  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

const VALID_STATUSES = new Set(['new', 'contacted', 'in_progress', 'booked', 'closed']);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('admin-authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await (ctx as any).params;

    if (!id || typeof id !== 'string' || !isUuid(id)) {
      return NextResponse.json({ error: 'Invalid inquiry id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body?.status as string | undefined;

    if (!status || typeof status !== 'string' || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    const { data, error } = await supabase
      .from('organizer_inquiries')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating organizer inquiry:', error);
      return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Organizer inquiries PATCH API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
