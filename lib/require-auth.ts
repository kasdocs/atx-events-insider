import { createSupabaseServerAnonClient } from '@/lib/supabase-server';

export async function requireAuth() {
  const supabase = createSupabaseServerAnonClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error('UNAUTHENTICATED');
  }

  return data.user;
}
