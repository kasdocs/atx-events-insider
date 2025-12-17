import { notFound } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import NewsletterSignup from '@/app/components/NewsletterSignup';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type StoryRow = Database['public']['Tables']['stories']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createSupabaseServerAnonClient();

  // Fetch the specific story
  const { data: story, error: storyErr } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .single<StoryRow>();

  if (storyErr || !story) notFound();

  // Fetch the related event if event_id exists
  let relatedEvent: EventRow | null = null;

  if (story.event_id) {
    const { data: eventData, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', story.event_id)
      .single<EventRow>();

    if (!eventErr && eventData) relatedEvent = eventData;
  }

  // Fetch other recent stories
  const { data: recentStories } = await supabase
    .from('stories')
    .select('*')
    .neq('id', story.id)
    .order('published_date', { ascending: false })
    .limit(3)
    .returns<StoryRow[]>();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <a
          href="/stories"
          className="text-gray-600 hover:text-purple-600 flex items-center gap-2 text-sm font-semibold"
        >
          ← Back to Stories
        </a>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Badges */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {story.featured && (
            <span
              className="inline-block px-4 py-2 text-sm font-semibold rounded-full text-white"
              style={{ backgroundColor: '#FF006E' }}
            >
              ⭐ Featured Story
            </span>
          )}
          {story.story_type && (
            <span className="inline-block px-4 py-2 text-sm font-semibold rounded-full bg-purple-100 text-purple-700">
              {story.story_type}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
          {story.title}
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <span className="font-semibold">By {story.author || 'Unknown'}</span>
          <span>•</span>
          <span>{formatDate(story.published_date)}</span>
        </div>

        {/* Cover Image */}
        <div className="mb-8 rounded-xl overflow-hidden">
          <img
            src={
              story.cover_image ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200'
            }
            alt={story.title ?? 'Story'}
            className="w-full"
          />
        </div>

        {/* Excerpt */}
        {story.excerpt && (
          <div className="text-xl text-gray-700 mb-8 p-6 bg-purple-50 rounded-xl border-l-4 border-purple-600">
            {story.excerpt}
          </div>
        )}

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-gray-800 leading-relaxed whitespace-pre-line">
            {story.content || ''}
          </div>
        </div>

        {/* Related Event */}
        {relatedEvent && (
          <div className="mt-12 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B2CBF' }}>
              📅 Attend This Event
            </h2>
            <div className="max-w-md">
              <EventCard event={relatedEvent} />
            </div>
          </div>
        )}

        {/* More Stories */}
        {recentStories && recentStories.length > 0 && (
          <div className="mt-12 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B2CBF' }}>
              More Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentStories.map((recentStory) => (
                <a
                  key={recentStory.id}
                  href={`/stories/${recentStory.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200">
                      <img
                        src={
                          recentStory.cover_image ||
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200'
                        }
                        alt={recentStory.title ?? 'Story'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {recentStory.featured && (
                          <span className="inline-block px-2 py-0.5 bg-pink-500 text-white text-xs font-semibold rounded">
                            ⭐ Featured
                          </span>
                        )}
                        {recentStory.story_type && (
                          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            {recentStory.story_type}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm mb-2 group-hover:text-purple-600 line-clamp-2">
                        {recentStory.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatDate(recentStory.published_date)}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="max-w-md mx-auto">
            <NewsletterSignup source="story-page" />
          </div>
        </div>
      </article>
    </div>
  );
}
