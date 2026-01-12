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

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FormBody;

    // Basic validation
    if (!body?.name?.trim()) return jsonError('Name is required.');
    if (!body?.email?.trim() || !isValidEmail(body.email)) return jsonError('A valid email is required.');
    if (!body?.package_interest) return jsonError('Package interest is required.');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) return jsonError('Missing NEXT_PUBLIC_SUPABASE_URL on server.', 500);
    if (!serviceRoleKey) return jsonError('Missing SUPABASE_SERVICE_ROLE_KEY on server.', 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert row
    const { error } = await supabase.from('organizer_inquiries').insert([
      {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        event_name: body.event_name?.trim() || null,
        event_date: body.event_date || null,
        event_description: body.event_description?.trim() || null,
        package_interest: body.package_interest,
        goals_and_questions: body.goals_and_questions?.trim() || null,
        status: 'new', // remove/rename if your table does not have this column
      },
    ]);

    if (error) {
      console.error('Organizer inquiry insert failed:', error);
      return jsonError('Database insert failed.', 500);
    }

    // If you also email the guide, do it here (Resend, etc). Keeping this minimal for now.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Organizer inquiry POST error:', err);
    return jsonError('Invalid request body.', 400);
  }
}

// Optional: helps if anything ever triggers preflight, and keeps things explicit.
export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
