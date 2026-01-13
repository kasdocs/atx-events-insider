import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type PackageInterest = 'featured' | 'premium' | 'full_production' | 'monthly' | 'not_sure';

type FormBody = {
  name: string;
  email: string;
  phone?: string;
  event_name?: string;
  event_date?: string; // YYYY-MM-DD
  event_description?: string;
  package_interest: PackageInterest;
  goals_and_questions?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function getSupabaseEnv() {
  // ✅ Server-only first. Do NOT rely on client env vars for server code.
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { supabaseUrl, serviceRoleKey };
}

function normalizeBody(body: FormBody) {
  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone?.trim() || null,
    event_name: body.event_name?.trim() || null,
    event_date: body.event_date?.trim() || null,
    event_description: body.event_description?.trim() || null,
    package_interest: body.package_interest,
    goals_and_questions: body.goals_and_questions?.trim() || null,
  };
}

export async function POST(req: Request) {
  // Parse JSON safely (keeps route resilient)
  let body: FormBody;
  try {
    body = (await req.json()) as FormBody;
  } catch {
    return jsonError('Invalid JSON body.', 400);
  }

  // Basic validation
  if (!body?.name?.trim()) return jsonError('Name is required.');
  if (!body?.email?.trim() || !isValidEmail(body.email)) return jsonError('A valid email is required.');
  if (!body?.package_interest) return jsonError('Package interest is required.');

  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();

  // IMPORTANT:
  // If these are missing in Vercel project env vars, your route can’t write to Supabase.
  if (!supabaseUrl) {
    return jsonError('Missing SUPABASE_URL on server.', 500);
  }
  if (!serviceRoleKey) {
    return jsonError('Missing SUPABASE_SERVICE_ROLE_KEY on server.', 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const rowBase = normalizeBody(body);

  // Insert row. We’ll try with `status` first, then retry without it if that column doesn’t exist.
  const withStatus = { ...rowBase, status: 'new' };

  const attempt1 = await supabase.from('organizer_inquiries').insert([withStatus]);

  if (attempt1.error) {
    const msg = attempt1.error.message || '';
    const statusMissing =
      msg.toLowerCase().includes('column') &&
      msg.toLowerCase().includes('status') &&
      msg.toLowerCase().includes('does not exist');

    if (statusMissing) {
      const attempt2 = await supabase.from('organizer_inquiries').insert([rowBase]);

      if (attempt2.error) {
        console.error('Organizer inquiry insert failed (retry without status):', attempt2.error);
        return jsonError('Database insert failed.', 500, {
          supabase: {
            message: attempt2.error.message,
            code: attempt2.error.code,
            details: attempt2.error.details,
            hint: attempt2.error.hint,
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    console.error('Organizer inquiry insert failed:', attempt1.error);
    return jsonError('Database insert failed.', 500, {
      supabase: {
        message: attempt1.error.message,
        code: attempt1.error.code,
        details: attempt1.error.details,
        hint: attempt1.error.hint,
      },
    });
  }

  // ✅ Your Kit flow: you said Kit sends the guide, so on success we return ok: true
  // and the client can show “sent” confidently.
  return NextResponse.json({ ok: true });
}

// Optional: explicit preflight handler (harmless and can help if anything triggers OPTIONS)
export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
