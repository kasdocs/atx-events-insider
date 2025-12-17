// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  console.log('Supabase URL host:', url?.replace(/^https?:\/\//, '').split('/')[0]);
console.log('Service role key length:', serviceRoleKey?.length);

}
