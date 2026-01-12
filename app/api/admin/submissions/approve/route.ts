import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(req: Request) {
  try {
    // Match your existing auth cookie pattern
    const cookieStore = await cookies();
    const authed = cookieStore.get('admin-authenticated');
    if (!authed?.value) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const submission_id = Number(body?.submission_id);

    if (!Number.isFinite(submission_id)) {
      return badRequest('submission_id is required.');
    }

    // Optional overrides from Edit & Approve
    const overrides = (body?.overrides ?? {}) as Record<string, any>;

    // Use service role on server if you have it; fallback to anon
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Load submission
    const { data: sub, error: subErr } = await supabase
      .from('event_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (subErr || !sub) {
      return NextResponse.json({ error: subErr?.message || 'Submission not found.' }, { status: 404 });
    }

    if (sub.status !== 'pending') {
      return badRequest(`Submission is not pending (current: ${sub.status}).`);
    }

    // Merge overrides (only allow known fields)
    const merged = {
      title: overrides.title ?? sub.title,
      event_date: overrides.event_date ?? sub.event_date,
      time: overrides.time ?? sub.time ?? null,
      location: overrides.location ?? sub.location,
      event_type: overrides.event_type ?? sub.event_type,
      subtype_1: overrides.subtype_1 ?? sub.subtype_1 ?? null,
      subtype_2: overrides.subtype_2 ?? sub.subtype_2 ?? null,
      subtype_3: overrides.subtype_3 ?? sub.subtype_3 ?? null,
      neighborhood: overrides.neighborhood ?? sub.neighborhood ?? null,
      pricing_type: overrides.pricing_type ?? sub.pricing_type,
      description: overrides.description ?? sub.description ?? null,
      image_url: overrides.image_url ?? sub.image_url ?? null,
      price: overrides.price ?? sub.price ?? null,
      instagram_url: overrides.instagram_url ?? sub.instagram_url ?? null,
      insider_tip: overrides.insider_tip ?? sub.insider_tip ?? null,
    };

    // Basic dedupe: if an event already exists with same title+date+location, block
    // (adjust to your own dedupe rules if needed)
    const { data: dupes } = await supabase
      .from('events')
      .select('id')
      .eq('title', merged.title)
      .eq('event_date', merged.event_date)
      .eq('location', merged.location)
      .limit(1);

    if (Array.isArray(dupes) && dupes.length > 0) {
      return badRequest('Looks like this event may already be published (duplicate detected).');
    }

    // Generate slug consistently on server
    const baseSlug = slugify(`${merged.title}-${merged.event_date}`);
    let slug = baseSlug;

    // Make slug unique if needed
    const { data: slugHit } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (Array.isArray(slugHit) && slugHit.length > 0) {
      slug = `${baseSlug}-${submission_id}`;
    }

    // Create event
    const eventInsert = {
      ...merged,
      slug,
      vibe: [], // you mentioned this
    };

    const { data: createdEvent, error: eventErr } = await supabase
      .from('events')
      .insert(eventInsert)
      .select('id')
      .single();

    if (eventErr || !createdEvent) {
      return NextResponse.json({ error: eventErr?.message || 'Failed to create event.' }, { status: 500 });
    }

    // Mark submission approved + store created event id (recommended)
    const { error: updErr } = await supabase
      .from('event_submissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        published_event_id: createdEvent.id, // add this column if you can; otherwise remove this line
      })
      .eq('id', submission_id);

    if (updErr) {
      // We created an event but could not update submission. Surface clearly.
      return NextResponse.json(
        { error: `Event created (${createdEvent.id}) but failed to update submission: ${updErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event_id: createdEvent.id });
  } catch (e: any) {
    console.error('Approve submission error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
