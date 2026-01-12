import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const authed = cookieStore.get('admin-authenticated');
    if (!authed?.value) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const submission_id = Number(body?.submission_id);

    if (!Number.isFinite(submission_id)) {
      return badRequest('submission_id is required.');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('event_submissions')
      .delete()
      .eq('id', submission_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete submission error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
