// app/authors/[slug]/page.tsx
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { createClient } from '@supabase/supabase-js';

type AuthorRow = {
  id: string;
  name: string | null;
  slug: string | null;
  bio: string | null;
  favorite_event_type: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type StoryCard = {
  id: number;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  cover_image: string | null;
  published_date: string | null;
  featured: boolean | null;
  story_type: string | null;
  event_id: number | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

  // Untyped intentionally since you’re skipping database.types.ts regen
  return createClient(url, anon, {
    auth: { persistSession: false },
  });
}

function initials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + second).toUpperCase();
}

function formatDate(dateString: string | null) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = getSupabase();

  // 1) Author
  const { data: authorData, error: authorErr } = await supabase
    .from('authors')
    .select('id, name, slug, bio, favorite_event_type, avatar_url, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (authorErr || !authorData) notFound();

  const author = authorData as AuthorRow;

  const authorName = (author.name ?? '').trim() || 'Unknown';

  // 2) Stories by author
  const { data: storiesData, error: storiesErr } = await supabase
    .from('stories')
    .select('id, title, slug, excerpt, cover_image, published_date, featured, story_type, event_id')
    .eq('author_id', author.id)
    .order('published_date', { ascending: false });

  const stories: StoryCard[] = Array.isArray(storiesData) ? (storiesData as StoryCard[]) : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Top / Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/authors"
          className="text-gray-600 hover:text-purple-700 flex items-center gap-2 text-sm font-semibold"
        >
          ← Back to Contributors
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-12 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={authorName}
                className="h-24 w-24 rounded-3xl object-cover border border-gray-200"
              />
            ) : (
              <div
                className="h-24 w-24 rounded-3xl flex items-center justify-center font-extrabold text-3xl border"
                style={{ backgroundColor: '#F5F0FF', borderColor: '#E6D9FF', color: '#7B2CBF' }}
              >
                {initials(authorName)}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: '#7B2CBF' }}>
                {authorName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {author.favorite_event_type ? (
                  <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-4 py-2 text-sm font-semibold">
                    Favorite: {author.favorite_event_type}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-600 px-4 py-2 text-sm font-semibold border border-gray-200">
                    Favorite: TBD
                  </span>
                )}

                {author.created_at ? (
                  <span className="text-sm text-gray-500">
                    Contributor since{' '}
                    {new Date(author.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-gray-700 leading-relaxed max-w-3xl">
                {(author.bio ?? '').trim() || 'Bio coming soon.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: '#7B2CBF' }}>
            Stories by {authorName}
          </h2>

          <Link
            href="/stories"
            className="hidden sm:inline-flex px-5 py-3 rounded-xl font-semibold border-2 hover:bg-purple-600 hover:text-white transition-colors"
            style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
          >
            All stories →
          </Link>
        </div>

        {storiesErr && (
          <div className="mb-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
            Could not load stories. {storiesErr.message}
          </div>
        )}

        {!storiesErr && stories.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700">
            No stories yet. Check back soon.
          </div>
        )}

        {stories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((s) => {
              const href = s.slug ? `/stories/${s.slug}` : '/stories';
              const title = s.title ?? 'Untitled';
              const date = formatDate(s.published_date);

              return (
                <Link
                  key={s.id}
                  href={href}
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={
                        s.cover_image ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200'
                      }
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {s.featured && (
                        <span
                          className="inline-block px-3 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: '#FF006E' }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                      {s.story_type && (
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                          {s.story_type}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm text-gray-700 line-clamp-3">{s.excerpt ?? ''}</p>

                    <div className="mt-4 text-xs text-gray-500">{date}</div>
                  </div>

                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7B2CBF, #FF006E)' }} />
                </Link>
              );
            })}
          </div>
        )}

        <Link
          href="/stories"
          className="sm:hidden inline-flex mt-8 px-5 py-3 rounded-xl font-semibold border-2 hover:bg-purple-600 hover:text-white transition-colors"
          style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
        >
          All stories →
        </Link>
      </div>
    </div>
  );
}
