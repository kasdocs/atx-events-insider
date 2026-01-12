'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export function createSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Never throw in the browser client factory.
  // If env is missing, return null so the UI can degrade gracefully.
  if (!url || !anonKey) return null;

  return createClient<Database>(url, anonKey);
}
