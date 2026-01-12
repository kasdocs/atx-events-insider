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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('admin-authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabase();

    const { data, error } = await supabase
      .from('organizer_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizer inquiries:', error);
      return NextResponse.json({ error: 'Failed to load inquiries' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('Organizer inquiries API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
