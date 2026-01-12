'use client';

import { useEffect, useState } from 'react';

type Story = {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
};

export default function StoriesClient() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch('/api/stories', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load stories (${res.status})`);

        const data = await res.json();
        // adjust if your API shape is { stories: [...] }
        const list = Array.isArray(data) ? data : data.stories;
        setStories(list || []);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load stories.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10">Loading stories…</div>;
  if (errorMsg) return <div className="max-w-6xl mx-auto px-4 py-10 text-red-600">{errorMsg}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Stories</h1>

      {stories.length === 0 ? (
        <div className="text-gray-600">No stories yet.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <a
              key={String(s.id)}
              href={`/stories/${s.slug}`}
              className="rounded-2xl border p-5 hover:shadow-sm transition-shadow"
            >
              <div className="font-semibold text-gray-900">{s.title}</div>
              {s.excerpt ? <div className="mt-2 text-sm text-gray-600">{s.excerpt}</div> : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
