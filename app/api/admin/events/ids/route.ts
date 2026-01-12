import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get("admin-authenticated");

  if (authenticated?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerServiceClient();

  const { data, error } = await supabase
    .from("events")
    .select("id, title")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}
