'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';

type StoryRow = Database['public']['Tables']['stories']['Row'];

export default function FeaturedStoryHero() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [featuredStory, setFeaturedStory] = useState<StoryRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchFeaturedStory = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select(
          'id, created_at, title, slug, content, cover_image, author, published_date, event_id, featured, excerpt, story_type'
        )
        .eq('featured', true)
        .order('published_date', { ascending: false })
        .limit(1)
        .single()
        .returns<StoryRow>();

      if (!alive) return;

      if (error) {
        console.error('Error fetching featured story:', error);
        setFeaturedStory(null);
      } else {
        setFeaturedStory(data ?? null);
      }

      setLoading(false);
    };

    fetchFeaturedStory();

    return () => {
      alive = false;
    };
  }, [supabase]);

  if (loading || !featuredStory) return null;

  const published = featuredStory.published_date
    ? new Date(featuredStory.published_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="relative bg-gradient-to-br from-purple-900 to-pink-900 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={
            featuredStory.cover_image ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200'
          }
          alt={featuredStory.title ?? 'Featured story'}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-pink-900/70" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <span className="text-2xl">⭐</span>
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              Featured Story
            </span>
          </div>

          {featuredStory.story_type && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-pink-500 text-white text-xs font-semibold rounded-full">
                {featuredStory.story_type}
              </span>
            </div>
          )}

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {featuredStory.title}
          </h2>

          {featuredStory.excerpt && (
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
              {featuredStory.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-white/80 mb-8">
            {featuredStory.author && (
              <span className="font-semibold">By {featuredStory.author}</span>
            )}
            {featuredStory.author && published && <span>•</span>}
            {published && <span>{published}</span>}
          </div>

          {featuredStory.slug && (
            <a
              href={`/stories/${featuredStory.slug}`}
              className="inline-block px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              Read the Full Story →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
