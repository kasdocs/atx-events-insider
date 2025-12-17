import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function requireAuth() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error('UNAUTHENTICATED');
  }

  return data.user;
}
