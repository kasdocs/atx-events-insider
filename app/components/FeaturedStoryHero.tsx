'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type StoryRow = {
  id: number;
  created_at: string | null;
  title: string | null;
  slug: string | null;
  content: string | null;
  cover_image: string | null;
  author: string | null;
  published_date: string | null;
  event_id: number | null;
  featured: boolean | null;
  excerpt: string | null;
  story_type: string | null;
};

export default function FeaturedStoryHero() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

useEffect(() => {
  setSupabase(createSupabaseBrowserClient());
}, []);

  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<StoryRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedStory = async () => {
      setLoading(true);

      // ✅ Guard: supabase can be null if env vars are missing
      if (!supabase) {
        if (!cancelled) {
          setStory(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('stories')
        .select(
          'id, created_at, title, slug, content, cover_image, author, published_date, event_id, featured, excerpt, story_type'
        )
        .eq('featured', true)
        .order('published_date', { ascending: false })
        .limit(1)
        .maybeSingle<StoryRow>();

      if (cancelled) return;

      if (error) {
        console.error('Error fetching featured story:', error);
        setStory(null);
        setLoading(false);
        return;
      }

      setStory(data ?? null);
      setLoading(false);
    };

    fetchFeaturedStory();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading) return null;
  if (!story) return null;

  const title = story.title ?? 'Featured Story';
  const excerpt =
    (story.excerpt ?? '').trim() ||
    (story.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);

  const href = story.slug ? `/stories/${story.slug}` : '/stories';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-10">
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
        {story.cover_image ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.cover_image}
              alt={title}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-900">
                ⭐ Featured story
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white">{title}</h2>
              {excerpt ? <p className="mt-3 text-white/90 max-w-3xl">{excerpt}…</p> : null}

              <div className="mt-5">
                <Link
                  href={href}
                  className="inline-flex items-center px-5 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#7B2CBF' }}
                >
                  Read story →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
              ⭐ Featured story
            </div>

            <h2 className="mt-4 text-3xl font-extrabold" style={{ color: '#7B2CBF' }}>
              {title}
            </h2>

            {excerpt ? <p className="mt-3 text-gray-700 max-w-3xl">{excerpt}…</p> : null}

            <div className="mt-5">
              <Link
                href={href}
                className="inline-flex items-center px-5 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#7B2CBF' }}
              >
                Read story →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
