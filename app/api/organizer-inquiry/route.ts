import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Server-side client (service role preferred for admin reads)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('admin-authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your table has created_at in the screenshot
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
