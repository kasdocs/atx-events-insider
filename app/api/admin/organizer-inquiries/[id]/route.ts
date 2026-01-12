import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Server-only: use service role if available (recommended for admin writes with RLS on)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_STATUSES = new Set([
  'new',
  'contacted',
  'in_progress',
  'booked',
  'closed',
]);

function isUuid(value: string) {
  // UUID v1–v5
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

    // IMPORTANT: Next may provide params as a Promise in some setups
    const { id } = await (ctx as any).params;

    if (!id || typeof id !== 'string' || !isUuid(id)) {
      return NextResponse.json({ error: 'Invalid inquiry id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body?.status as string | undefined;

    if (!status || typeof status !== 'string' || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

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
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
