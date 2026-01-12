// app/api/featured/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerAnonClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerAnonClient();

  // Only show events today or later (based on your `event_date` column which is `YYYY-MM-DD`)
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  // We avoid Supabase `.or()` parsing headaches by doing the starts/ends gating in JS.
  // This is fine because featured rows are small (usually <= 20).
  const { data, error } = await supabase
    .from("featured_events")
    .select(
      `
      id,
      event_id,
      rank,
      is_active,
      starts_at,
      ends_at,
      created_at,
      updated_at,
      events:event_id (
        id,
        title,
        slug,
        event_date,
        time,
        location,
        neighborhood,
        event_type,
        vibe,
        pricing_type,
        price,
        image_url,
        description,
        instagram_url,
        insider_tip,
        subtype_1,
        subtype_2,
        subtype_3
      )
    `
    )
    .eq("is_active", true)
    // Only future events
    .gte("events.event_date", today)
    .order("rank", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date(nowIso).getTime();

  const featured = (data ?? [])
    // Must have joined event record
    .filter((row: any) => row?.events?.id)
    // Time window gating:
    // - starts_at is null OR starts_at <= now
    // - ends_at is null OR ends_at > now
    .filter((row: any) => {
      const startsOk =
        !row.starts_at || new Date(row.starts_at).getTime() <= now;
      const endsOk =
        !row.ends_at || new Date(row.ends_at).getTime() > now;
      return startsOk && endsOk;
    });

  return NextResponse.json({ featured });
}
