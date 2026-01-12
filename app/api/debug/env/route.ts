import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Do NOT return the values.
  return NextResponse.json({
    hasUrl,
    hasAnon,
    hasService,
    nodeEnv: process.env.NODE_ENV,
  });
}
