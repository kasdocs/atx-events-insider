// app/authors/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type AuthorRow = Database['public']['Tables']['authors']['Row'];

function initials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + second).toUpperCase();
}

function shortBio(bio: string | null, max = 120) {
  const s = (bio ?? '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max).trim() + '…';
}

export default async function AuthorsPage() {
  const supabase = createSupabaseServerAnonClient();

  const { data, error } = await supabase
    .from('authors')
    .select('id, name, slug, bio, favorite_event_type, avatar_url, created_at')
    .order('name', { ascending: true });

  const authors: AuthorRow[] = Array.isArray(data) ? (data as AuthorRow[]) : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight" style={{ color: '#7B2CBF' }}>
                Contributors
              </h1>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl">
                The people behind the recaps, tips, and “you had to be there” moments.
              </p>
            </div>

            <div className="w-full md:w-auto">
              <Link
                href="/stories"
                className="inline-flex w-full md:w-auto items-center justify-center px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FF006E' }}
              >
                Read the latest stories →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
            Could not load contributors. {error.message}
          </div>
        )}

        {!error && authors.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto max-w-xl">
              <h2 className="text-2xl font-bold" style={{ color: '#7B2CBF' }}>
                No contributors yet
              </h2>
              <p className="mt-2 text-gray-600">
                Once you add authors in the admin, they will show up here automatically.
              </p>
            </div>
          </div>
        )}

        {authors.length > 0 && (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map((a) => {
                const name = (a.name ?? '').trim() || 'Unknown';
                const slug = (a.slug ?? '').trim();
                const hasSlug = Boolean(slug);

                const href = hasSlug ? `/authors/${slug}` : '/authors';

                return (
                  <Link
                    key={a.id}
                    href={href}
                    className="group block rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {a.avatar_url ? (
                          <img
                            src={a.avatar_url}
                            alt={name}
                            className="h-14 w-14 rounded-2xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div
                            className="h-14 w-14 rounded-2xl flex items-center justify-center font-extrabold border"
                            style={{
                              backgroundColor: '#F3E8FF',
                              color: '#7B2CBF',
                              borderColor: '#E9D5FF',
                            }}
                          >
                            {initials(name)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                              {name}
                            </h3>

                            {a.favorite_event_type && (
                              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                                {a.favorite_event_type}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-gray-600">
                            {shortBio(a.bio, 120) || 'Austin event obsessive. Always hunting down the good stuff.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: '#FF006E' }}>
                          View profile →
                        </span>

                        {a.created_at ? (
                          <span className="text-xs text-gray-400">
                            Joined{' '}
                            {new Date(a.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Contributor</span>
                        )}
                      </div>
                    </div>

                    <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7B2CBF, #FF006E)' }} />
                  </Link>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="mt-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-pink-50 to-purple-50 p-6">
              <h2 className="text-xl font-extrabold" style={{ color: '#7B2CBF' }}>
                Want to be a contributor?
              </h2>
              <p className="mt-2 text-gray-700 max-w-2xl">
                If you host events or have a story idea, hit the organizers page and tell us what you’re building.
              </p>
              <div className="mt-5">
                <Link
                  href="/for-organizers"
                  className="inline-flex items-center px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#7B2CBF' }}
                >
                  For organizers →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
