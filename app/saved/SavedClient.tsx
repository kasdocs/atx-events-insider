'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SavedClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // fetch saved events here using supabase
      setLoading(false);
    }
    load();
  }, [supabase]);

  return <div>{loading ? 'Loading...' : 'Saved content here'}</div>;
}
