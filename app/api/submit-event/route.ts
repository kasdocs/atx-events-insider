import { NextResponse } from "next/server";
import { createSupabaseServerAnonClient } from "@/lib/supabase-server";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isValidISODate(dateStr: string) {
  // expects YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + "T00:00:00Z");
  return !Number.isNaN(d.getTime());
}

function isValidTime(timeStr: string) {
  // expects HH:MM
  if (!timeStr) return true; // optional
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

function getClientIp(request: Request) {
  // Vercel/Proxies commonly set x-forwarded-for
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerAnonClient();
    const body = await request.json();

    // Honeypot spam trap (hidden "website" field in the form)
    const honeypot = asString(body?.website).trim();
    if (honeypot) {
      return NextResponse.json({ success: true }); // pretend success
    }

    // Required
    const title = asString(body?.title).trim();
    const event_date = asString(body?.event_date).trim();
    const location = asString(body?.location).trim();
    const event_type = asString(body?.event_type).trim();
    const pricing_type = asString(body?.pricing_type).trim();
    const organizer_name = asString(body?.organizer_name).trim();
    const organizer_email = asString(body?.organizer_email).trim().toLowerCase();

    // In your UI it's required, so enforce it
    const description = asString(body?.description).trim();

    if (!title) return badRequest("Event title is required.");
    if (!event_date) return badRequest("Event date is required.");
    if (!isValidISODate(event_date)) return badRequest("Event date must be a valid date.");
    if (!location) return badRequest("Location is required.");
    if (!event_type) return badRequest("Event type is required.");
    if (!pricing_type) return badRequest("Pricing type is required.");
    if (!organizer_name) return badRequest("Organizer name is required.");
    if (!organizer_email || !/^\S+@\S+\.\S+$/.test(organizer_email)) {
      return badRequest("Organizer email must be valid.");
    }
    if (!description) return badRequest("Description is required.");
    if (description.length > 5000) return badRequest("Description is too long.");

    const time = asString(body?.time).trim();
    if (!isValidTime(time)) return badRequest("Time must be in HH:MM format.");

    const ip_address = getClientIp(request);
    const user_agent = request.headers.get("user-agent");

    const payload = {
      title,
      event_date,
      time: time || null,
      location,
      event_type,
      subtype_1: asString(body?.subtype_1).trim() || null,
      subtype_2: asString(body?.subtype_2).trim() || null,
      subtype_3: asString(body?.subtype_3).trim() || null,
      neighborhood: asString(body?.neighborhood).trim() || null,
      pricing_type,
      description,
      image_url: asString(body?.image_url).trim() || null,
      price: asString(body?.price).trim() || null,
      instagram_url: asString(body?.instagram_url).trim() || null,
      insider_tip: asString(body?.insider_tip).trim() || null,
      organizer_name,
      organizer_email,
      organizer_phone: asString(body?.organizer_phone).trim() || null,
      organizer_instagram: asString(body?.organizer_instagram).trim() || null,
      status: "pending",
      ip_address,
      user_agent,
    };

    const { data, error } = await supabase
      .from("event_submissions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
