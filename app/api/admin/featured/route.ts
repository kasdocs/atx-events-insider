import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerServiceClient } from "@/lib/supabase-server";

async function isAdminAuthed() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get("admin-authenticated");
  return authenticated?.value === "true";
}

const MAX_ACTIVE_FEATURED = 8;

function parseIsoOrNull(input: any): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function msOrNull(iso: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return isNaN(t) ? null : t;
}

function windowOverlaps(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null
) {
  const aS = msOrNull(aStart);
  const aE = msOrNull(aEnd);
  const bS = msOrNull(bStart);
  const bE = msOrNull(bEnd);

  const startA = aS ?? Number.NEGATIVE_INFINITY;
  const endA = aE ?? Number.POSITIVE_INFINITY;

  const startB = bS ?? Number.NEGATIVE_INFINITY;
  const endB = bE ?? Number.POSITIVE_INFINITY;

  return startA <= endB && startB <= endA;
}

async function shiftRanksForInsert(
  supabase: ReturnType<typeof createSupabaseServerServiceClient>,
  insertRank: number
) {
  const { data, error } = await supabase
    .from("featured_events")
    .select("id, rank")
    .gte("rank", insertRank)
    .order("rank", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{ id: string; rank: number }>;
  if (rows.length === 0) return;

  await Promise.all(
    rows.map((r) =>
      supabase
        .from("featured_events")
        .update({ rank: Number(r.rank) + 1 })
        .eq("id", r.id)
    )
  );
}

async function shiftRanksForMove(
  supabase: ReturnType<typeof createSupabaseServerServiceClient>,
  rowId: string,
  newRank: number
) {
  const { data: current, error: curErr } = await supabase
    .from("featured_events")
    .select("id, rank")
    .eq("id", rowId)
    .maybeSingle();

  if (curErr) throw new Error(curErr.message);
  if (!current) throw new Error("Featured row not found.");

  const oldRank = Number((current as any).rank);
  const nextRank = Number(newRank);

  if (!Number.isFinite(oldRank) || !Number.isFinite(nextRank)) return;
  if (oldRank === nextRank) return;

  if (nextRank < oldRank) {
    const { data: between, error } = await supabase
      .from("featured_events")
      .select("id, rank")
      .gte("rank", nextRank)
      .lt("rank", oldRank)
      .order("rank", { ascending: true });

    if (error) throw new Error(error.message);

    const rows = (between ?? []) as Array<{ id: string; rank: number }>;
    await Promise.all(
      rows.map((r) =>
        supabase
          .from("featured_events")
          .update({ rank: Number(r.rank) + 1 })
          .eq("id", r.id)
      )
    );
  } else {
    const { data: between, error } = await supabase
      .from("featured_events")
      .select("id, rank")
      .gt("rank", oldRank)
      .lte("rank", nextRank)
      .order("rank", { ascending: true });

    if (error) throw new Error(error.message);

    const rows = (between ?? []) as Array<{ id: string; rank: number }>;
    await Promise.all(
      rows.map((r) =>
        supabase
          .from("featured_events")
          .update({ rank: Number(r.rank) - 1 })
          .eq("id", r.id)
      )
    );
  }

  const { error: updErr } = await supabase
    .from("featured_events")
    .update({ rank: nextRank })
    .eq("id", rowId);

  if (updErr) throw new Error(updErr.message);
}

async function enforceMaxActiveFeatured(
  supabase: ReturnType<typeof createSupabaseServerServiceClient>,
  opts: {
    action: "add" | "update";
    currentId?: string;
    nextIsActive: boolean;
    nextStartsAt: string | null;
    nextEndsAt: string | null;
  }
) {
  if (!opts.nextIsActive) return;

  const { data, error } = await supabase
    .from("featured_events")
    .select("id, is_active, starts_at, ends_at")
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
  }>;

  const overlapping = rows.filter((r) => {
    if (opts.currentId && r.id === opts.currentId) return false;
    return windowOverlaps(r.starts_at, r.ends_at, opts.nextStartsAt, opts.nextEndsAt);
  });

  if (overlapping.length >= MAX_ACTIVE_FEATURED) {
    throw new Error(
      `Too many active featured items overlapping this window. Limit is ${MAX_ACTIVE_FEATURED}.`
    );
  }
}

/**
 * GET /api/admin/featured
 * Returns featured rows joined with event basic fields.
 */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerServiceClient();

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
        event_date,
        time,
        location,
        neighborhood,
        event_type,
        vibe,
        pricing_type,
        price
      )
      `
    )
    .order("rank", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ featured: data ?? [] });
}

/**
 * POST /api/admin/featured
 * Body:
 *  { action: "add", event_id: number, rank?: number, is_active?: boolean, starts_at?: string|null, ends_at?: string|null }
 *  { action: "update", id: string, rank?: number, is_active?: boolean, starts_at?: string|null, ends_at?: string|null }
 *  { action: "remove", id: string }
 */
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerServiceClient();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = String(body?.action || "").toLowerCase();
  const featured = supabase.from("featured_events");

  try {
    if (action === "add") {
      const event_id = Number(body?.event_id);
      if (!Number.isFinite(event_id)) {
        return NextResponse.json({ error: "event_id must be a number" }, { status: 400 });
      }

      const is_active = typeof body?.is_active === "boolean" ? body.is_active : true;

      const starts_at = body?.starts_at === undefined ? null : parseIsoOrNull(body.starts_at);
      const ends_at = body?.ends_at === undefined ? null : parseIsoOrNull(body.ends_at);

      if (starts_at && ends_at) {
        const s = new Date(starts_at).getTime();
        const e = new Date(ends_at).getTime();
        if (e < s) {
          return NextResponse.json(
            { error: "ends_at must be after starts_at" },
            { status: 400 }
          );
        }
      }

      await enforceMaxActiveFeatured(supabase, {
        action: "add",
        nextIsActive: is_active,
        nextStartsAt: starts_at,
        nextEndsAt: ends_at,
      });

      let rank: number;
      if (Number.isFinite(Number(body?.rank))) {
        rank = Number(body.rank);
      } else {
        const { data: maxRow } = await supabase
          .from("featured_events")
          .select("rank")
          .order("rank", { ascending: false })
          .limit(1);

        const maxRank = (maxRow?.[0] as any)?.rank;
        rank = Number.isFinite(Number(maxRank)) ? Number(maxRank) + 1 : 100;
      }

      await shiftRanksForInsert(supabase, rank);

      const { error: insertError } = await featured.insert({
        event_id,
        rank,
        is_active,
        starts_at,
        ends_at,
      });

      if (insertError) {
        const msg = insertError.message.toLowerCase();
        const isDuplicate = msg.includes("duplicate") || msg.includes("unique");

        if (!isDuplicate) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        const { data: existing, error: exErr } = await supabase
          .from("featured_events")
          .select("id")
          .eq("event_id", event_id)
          .maybeSingle();

        if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
        const existingId = (existing as any)?.id as string | undefined;

        await enforceMaxActiveFeatured(supabase, {
          action: "update",
          currentId: existingId,
          nextIsActive: is_active,
          nextStartsAt: starts_at,
          nextEndsAt: ends_at,
        });

        if (existingId) {
          await shiftRanksForMove(supabase, existingId, rank);
        }

        const { error: updateError } = await featured
          .update({ rank, is_active, starts_at, ends_at })
          .eq("event_id", event_id);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      const id = String(body?.id || "").trim();
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

      const { data: current, error: curErr } = await supabase
        .from("featured_events")
        .select("id, is_active, starts_at, ends_at, rank")
        .eq("id", id)
        .maybeSingle();

      if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 });
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const update: Record<string, any> = {};

      let nextIsActive =
        body?.is_active !== undefined ? Boolean(body.is_active) : Boolean((current as any).is_active);

      let nextStartsAt =
        body?.starts_at !== undefined
          ? (body.starts_at ? parseIsoOrNull(body.starts_at) : null)
          : ((current as any).starts_at ?? null);

      let nextEndsAt =
        body?.ends_at !== undefined
          ? (body.ends_at ? parseIsoOrNull(body.ends_at) : null)
          : ((current as any).ends_at ?? null);

      if (nextStartsAt && nextEndsAt) {
        const s = new Date(nextStartsAt).getTime();
        const e = new Date(nextEndsAt).getTime();
        if (e < s) {
          return NextResponse.json(
            { error: "ends_at must be after starts_at" },
            { status: 400 }
          );
        }
      }

      await enforceMaxActiveFeatured(supabase, {
        action: "update",
        currentId: id,
        nextIsActive,
        nextStartsAt,
        nextEndsAt,
      });

      if (body?.rank !== undefined) {
        const r = Number(body.rank);
        if (!Number.isFinite(r)) {
          return NextResponse.json({ error: "rank must be a number" }, { status: 400 });
        }

        await shiftRanksForMove(supabase, id, r);
      } else {
        if (body?.is_active !== undefined) update.is_active = Boolean(body.is_active);
        if (body?.starts_at !== undefined) update.starts_at = nextStartsAt;
        if (body?.ends_at !== undefined) update.ends_at = nextEndsAt;

        if (Object.keys(update).length > 0) {
          const { error } = await featured.update(update).eq("id", id);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      const id = String(body?.id || "").trim();
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

      const { error } = await featured.delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use add | update | remove." },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
