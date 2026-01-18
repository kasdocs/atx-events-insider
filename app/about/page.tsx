// app/about/page.tsx
export const dynamic = 'force-dynamic';

import Navbar from '@/app/components/Navbar';

type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  favorite_event_type: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (a + b).toUpperCase();
}

function shortBio(bio: string | null, max = 140) {
  const s = (bio ?? '').trim();
  if (!s) return 'Bio coming soon.';
  if (s.length <= max) return s;
  return s.slice(0, max).trim() + '…';
}

export default async function AboutPage() {
  // Fetch authors via API route (must use absolute URL in server component)
  let authors: Author[] = [];
  try {
    const headersMod = await import('next/headers');
    const h = await headersMod.headers();

    const host = h.get('x-forwarded-host') ?? h.get('host');
    const forwardedProto = h.get('x-forwarded-proto');

    // Default to https when not specified (prod-safe), local still works via forwardedProto/host
    const proto = forwardedProto ?? (host?.includes('localhost') ? 'http' : 'https');

    if (host) {
      const url = `${proto}://${host}/api/authors`;
      const res = await fetch(url, { cache: 'no-store' });

      if (res.ok) {
        const json = await res.json();
        authors = Array.isArray(json) ? (json as Author[]) : [];
      }
    }
  } catch {
    authors = [];
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-700">
            <span className="inline-block h-2 w-2 rounded-full bg-purple-600" />
            Austin event recommendations, curated
          </div>

          <h1 className="mt-5 text-5xl font-extrabold tracking-tight mb-4" style={{ color: '#7B2CBF' }}>
            Hey, I’m Kas 👋
          </h1>

          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            I hunt down the good stuff so you don’t have to. If it’s happening in Austin and it’s actually worth your
            time, I’m trying to be there.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/browse"
              className="w-full sm:w-auto inline-flex justify-center px-8 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#7B2CBF' }}
            >
              Browse events →
            </a>
            <a
              href="/stories"
              className="w-full sm:w-auto inline-flex justify-center px-8 py-3 rounded-xl font-semibold border-2 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-colors"
              style={{ borderColor: '#FF006E', color: '#FF006E' }}
            >
              Read stories →
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Story */}
        <section className="mb-16">
          <h2 className="text-3xl font-extrabold mb-5" style={{ color: '#7B2CBF' }}>
            The story behind ATX Events Insider
          </h2>

          <div className="text-gray-700 leading-relaxed space-y-4 text-lg">
            <p>
              I started ATX Events Insider because I kept ending up at amazing events that barely anyone knew about. Art
              walks. Food truck hangs. Live music nights. Pop-ups in weird little corners of the city.
            </p>
            <p>
              Meanwhile, my friends and people following along on TikTok and Instagram kept asking the same thing:
              “What should I do this weekend?”
            </p>
            <p>
              So I built a home for the recommendations. Not a giant list of everything. Just the events and stories
              that feel like Austin.
            </p>
          </div>
        </section>

        {/* What makes it different */}
        <section className="mb-16 bg-purple-50 rounded-2xl p-8 border border-purple-100">
          <h2 className="text-3xl font-extrabold mb-6" style={{ color: '#7B2CBF' }}>
            What makes this different
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="text-sm font-extrabold mb-2" style={{ color: '#FF006E' }}>
                🎬 I go, then I tell you what it’s actually like
              </div>
              <p className="text-gray-700">
                I’m not just reposting flyers. I’m trying the food, talking to the hosts, and sharing the vibe so you
                know what you’re getting into.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="text-sm font-extrabold mb-2" style={{ color: '#FF006E' }}>
                🎟️ Free and low-cost events get the spotlight
              </div>
              <p className="text-gray-700">
                The best nights in Austin are not always expensive. I’ll always highlight the good free stuff when I
                find it.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="text-sm font-extrabold mb-2" style={{ color: '#FF006E' }}>
                🤝 Community-first, local-business-first
              </div>
              <p className="text-gray-700">
                If you’re a local organizer or small business, I’m rooting for you. When something is featured, I drive
                people to your page and your event.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="text-sm font-extrabold mb-2" style={{ color: '#FF006E' }}>
                📸 Stories, photo sets, and behind-the-scenes
              </div>
              <p className="text-gray-700">
                Some events deserve more than a quick blurb. That’s where stories come in, plus the little details
                flyers never tell you.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-3xl font-extrabold mb-5" style={{ color: '#7B2CBF' }}>
            The mission
          </h2>

          <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8 border border-pink-100">
            <p className="text-lg text-gray-800 leading-relaxed">
              Connect people with real Austin experiences, and help the organizers and small businesses behind them
              reach the audience they deserve.
            </p>
          </div>
        </section>

        {/* Authors */}
        <section className="mb-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold" style={{ color: '#7B2CBF' }}>
                Authors
              </h2>
              <p className="mt-2 text-gray-700">The people behind the picks. More writers coming soon.</p>
            </div>

            <a
              href="/authors"
              className="hidden sm:inline-flex px-5 py-3 rounded-xl font-semibold border-2 hover:bg-purple-600 hover:text-white transition-colors"
              style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
            >
              View all →
            </a>
          </div>

          <div className="mt-6">
            {authors.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700">
                Authors will show up here once added in the admin.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {authors.slice(0, 6).map((a) => {
                  const name = (a.name ?? '').trim() || 'Unknown';
                  const slug = (a.slug ?? '').trim();

                  return (
                    <a
                      key={a.id}
                      href={slug ? `/authors/${slug}` : '/authors'}
                      className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
                    >
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
                            style={{ backgroundColor: '#F5F0FF', borderColor: '#E6D9FF', color: '#7B2CBF' }}
                          >
                            {initials(name)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-extrabold text-gray-900 group-hover:text-purple-700 truncate">
                            {name}
                          </div>

                          {a.favorite_event_type ? (
                            <div className="mt-2 inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
                              Favorite: <span className="ml-1 font-bold">{a.favorite_event_type}</span>
                            </div>
                          ) : (
                            <div className="mt-2 inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-100">
                              Favorite: TBD
                            </div>
                          )}

                          <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {shortBio(a.bio, 140)}
                          </p>

                          <div className="mt-4 text-sm font-semibold text-purple-700">Read bio + stories →</div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <a
            href="/authors"
            className="sm:hidden inline-flex mt-6 px-5 py-3 rounded-xl font-semibold border-2 hover:bg-purple-600 hover:text-white transition-colors"
            style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
          >
            View all →
          </a>
        </section>

        {/* For Organizers */}
        <section className="mb-16">
          <h2 className="text-3xl font-extrabold mb-5" style={{ color: '#7B2CBF' }}>
            For organizers
          </h2>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-gray-200">
            <p className="text-lg text-gray-800 mb-6">
              If you’re hosting something in Austin, I’d love to see it. Submit your event, or check out the organizer
              page for details on features, coverage, and how this works.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              <div className="rounded-xl bg-white border border-gray-200 p-5">
                <div className="font-extrabold" style={{ color: '#FF006E' }}>
                  ✅ Submit an event
                </div>
                <p className="mt-2 text-gray-700 text-sm">
                  Get on the calendar. If it’s a fit, it can also get spotlighted on socials.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 p-5">
                <div className="font-extrabold" style={{ color: '#FF006E' }}>
                  📣 Want coverage?
                </div>
                <p className="mt-2 text-gray-700 text-sm">
                  Learn what featured stories include, what I need from you, and how timelines work.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/submit-event"
                className="inline-flex justify-center px-8 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#7B2CBF' }}
              >
                Submit your event →
              </a>

              <a
                href="/for-organizers"
                className="inline-flex justify-center px-8 py-3 rounded-xl font-semibold border-2 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-colors"
                style={{ borderColor: '#FF006E', color: '#FF006E' }}
              >
                Go to For Organizers →
              </a>
            </div>

            <div className="mt-5 text-sm text-gray-600">
              Quick question? DM me on Instagram:{' '}
              <a
                href="https://instagram.com/kasdocs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: '#FF006E' }}
              >
                @kasdocs
              </a>
            </div>
          </div>
        </section>

        {/* Connect */}
        <section className="text-center">
          <h2 className="text-3xl font-extrabold mb-5" style={{ color: '#7B2CBF' }}>
            Let’s connect
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Daily Austin recs, behind-the-scenes, and “you should go to this” energy.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="https://tiktok.com/@kasdocs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl font-semibold border-2 hover:bg-purple-600 hover:text-white transition-colors"
              style={{ borderColor: '#7B2CBF', color: '#7B2CBF' }}
            >
              TikTok @kasdocs
            </a>

            <a
              href="https://instagram.com/kasdocs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#FF006E' }}
            >
              Instagram @kasdocs
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
