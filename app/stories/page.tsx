'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type StoryRow = Database['public']['Tables']['stories']['Row'];

export default function StoriesPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create the browser client only after we're definitely in the browser.
  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      setSupabase(client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Supabase is not configured.';
      setErrorMsg(msg);
      setSupabase(null);
      setStories([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchStories = async () => {
      if (!supabase) return;

      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('stories')
        .select(
          'id, created_at, title, slug, content, cover_image, author, published_date, event_id, featured, excerpt, story_type'
        )
        .order('published_date', { ascending: false })
        .returns<StoryRow[]>();

      if (cancelled) return;

      if (error) {
        console.error('Error fetching stories:', error);
        setErrorMsg('Failed to load stories. Please try again.');
        setStories([]);
      } else {
        setStories(data ?? []);
      }

      setLoading(false);
    };

    fetchStories();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
            Stories
          </h1>
          <p className="text-xl text-gray-600">Behind the scenes of Austin&apos;s best events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {errorMsg && (
          <div className="text-center py-6">
            <p className="text-red-600 text-sm">{errorMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading stories...</p>
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => {
              const href = story.slug ? `/stories/${story.slug}` : '/stories';

              return (
                <Link key={story.id} href={href} className="group">
                  <article className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={
                          story.cover_image ||
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200'
                        }
                        alt={story.title ?? 'Story'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {story.featured && (
                          <span
                            className="inline-block px-3 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: '#FF006E' }}
                          >
                            ⭐ Featured
                          </span>
                        )}
                        {story.story_type && (
                          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                            {story.story_type}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">
                        {story.title ?? 'Untitled'}
                      </h2>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{story.excerpt ?? ''}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">By {story.author ?? 'Unknown'}</span>
                        <span className="text-gray-400">{formatDate(story.published_date)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No stories yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
