'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NewsletterSignup from './NewsletterSignup';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/lib/database.types';

type StoryRow = Database['public']['Tables']['stories']['Row'];

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNextWeekendRange() {
  const now = new Date();
  const currentDay = now.getDay();

  const daysUntilFriday = currentDay <= 5 ? 5 - currentDay : 5 + (7 - currentDay);

  const fri = new Date(now);
  fri.setDate(now.getDate() + daysUntilFriday);
  fri.setHours(0, 0, 0, 0);

  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  sun.setHours(23, 59, 59, 999);

  return { fri, sun };
}

export default function Sidebar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [recentStories, setRecentStories] = useState<StoryRow[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecentStories = async () => {
      setStoriesLoading(true);

      const { data, error } = await supabase
        .from('stories')
        .select(
          'id, created_at, title, slug, content, cover_image, author, published_date, event_id, featured, excerpt, story_type'
        )
        .order('published_date', { ascending: false })
        .limit(3)
        .returns<StoryRow[]>();

      if (cancelled) return;

      if (error) {
        console.error('Error fetching stories:', error);
        setRecentStories([]);
        setStoriesLoading(false);
        return;
      }

      setRecentStories(data ?? []);
      setStoriesLoading(false);
    };

    fetchRecentStories();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const weekend = getNextWeekendRange();
  const nextWeekStart = new Date();
  nextWeekStart.setDate(today.getDate() + 1);
  const nextWeekEnd = new Date();
  nextWeekEnd.setDate(today.getDate() + 7);

  return (
    <div className="space-y-8">
      {/* Recent Stories */}
      <div>
        <h3 className="text-xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
          📖 Recent Stories
        </h3>

        {storiesLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-32 bg-gray-200 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : recentStories.length > 0 ? (
          <div className="space-y-4">
            {recentStories.map((story) => {
              const href = story.slug ? `/stories/${story.slug}` : '/stories';

              return (
                <Link
                  key={story.id}
                  href={href}
                  className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <img
                    src={
                      story.cover_image ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
                    }
                    alt={story.title ?? 'Story'}
                    className="w-full h-32 object-cover"
                  />

                  <div className="p-3">
                    <div className="flex gap-2 mb-1 flex-wrap">
                      {story.featured && (
                        <span className="inline-block px-2 py-0.5 bg-pink-500 text-white text-xs font-semibold rounded">
                          ⭐ Featured
                        </span>
                      )}
                      {story.story_type && (
                        <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          {story.story_type}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                      {story.title ?? 'Untitled'}
                    </h4>

                    <p className="text-xs text-gray-500">{formatDate(story.published_date)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No stories yet</p>
        )}

        <Link
          href="/stories"
          className="block mt-4 text-sm font-semibold text-center py-2 rounded-lg border-2 hover:bg-purple-600 hover:text-white transition-colors"
          style={{
            borderColor: '#7B2CBF',
            color: '#7B2CBF',
          }}
        >
          View All Stories →
        </Link>
      </div>

      {/* Quick Date Jump */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
          📅 Quick Jump
        </h3>

        <div className="space-y-3">
          <Link
            href={`/browse?date=${toISODate(today)}`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">Today</div>
            <div className="text-xs text-gray-500">{fmtShort(today)}</div>
          </Link>

          <Link
            href={`/browse?date=${toISODate(tomorrow)}`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">Tomorrow</div>
            <div className="text-xs text-gray-500">{fmtShort(tomorrow)}</div>
          </Link>

          <Link
            href={`/browse?weekend=true`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">This Weekend</div>
            <div className="text-xs text-gray-500">
              {fmtShort(weekend.fri)} to {fmtShort(weekend.sun)}
            </div>
          </Link>

          <Link
            href={`/browse?nextweek=true`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">Next 7 Days</div>
            <div className="text-xs text-gray-500">
              {fmtShort(nextWeekStart)} to {fmtShort(nextWeekEnd)}
            </div>
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#7B2CBF' }}>
            Or pick a date:
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = `/browse?date=${e.target.value}`;
              }
            }}
          />
        </div>

        <Link
          href="/browse"
          className="block mt-4 text-sm font-semibold text-center py-2 rounded-lg border border-gray-200 hover:bg-white transition-colors"
        >
          Browse all events →
        </Link>
      </div>

      {/* Newsletter Signup */}
      <NewsletterSignup source="homepage-sidebar" />

      {/* Organizer CTA (replaces Submit Event CTA) */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h3 className="font-bold text-lg mb-2" style={{ color: '#7B2CBF' }}>
          🎉 Have an Event?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Want more visibility? Learn about featured placement and organizer promotion options.
        </p>

        <Link
          href="/for-organizers"
          className="block w-full px-4 py-3 text-center text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FF006E' }}
        >
          For Organizers →
        </Link>

        <div className="mt-3 text-center">
          <Link
            href="/submit-event"
            className="text-xs font-semibold text-purple-700 hover:text-purple-800 underline underline-offset-2"
          >
            Or submit for free
          </Link>
        </div>
      </div>
    </div>
  );
}
