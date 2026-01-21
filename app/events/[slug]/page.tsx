import { notFound } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import SaveToggleButton from '@/app/components/SaveToggleButton';
import RSVPWidget from '@/app/components/RSVPWidget';
import CopyLinkButton from '@/app/components/CopyLinkButton';
import { createSupabaseServerAnonClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';
import TrackEventView from './TrackEventView';
import TrackedOutboundLink from '@/app/components/TrackedOutboundLink';

type EventRow = Database['public']['Tables']['events']['Row'];

// Change this if Kas's author slug is different
const KAS_AUTHOR_SLUG = 'kas';
const KAS_AUTHOR_HREF = `/authors/${KAS_AUTHOR_SLUG}`;

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = createSupabaseServerAnonClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single<EventRow>();

  if (error || !event) notFound();

  // Public-only count, using the SECURITY DEFINER RPC you created
  let goingCount = 0;
  try {
    const { data, error: goingErr } = await (supabase as any).rpc('get_going_count', { p_event_id: event.id });
    if (!goingErr) goingCount = Number(data ?? 0) || 0;
  } catch {
    goingCount = 0;
  }

  let similarEvents: EventRow[] = [];
  if (event.event_type) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', event.event_type)
      .neq('slug', slug)
      .limit(3)
      .returns<EventRow[]>();

    similarEvents = data ?? [];
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const titleCase = (s: string) =>
    s
      .replaceAll('_', ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const vibeTags: string[] = Array.isArray(event.vibe) ? event.vibe : [];
  const formatVibe = (v: string) => titleCase(v);

  const getPricingText = () => {
    if (event.pricing_type === 'Free') return '🎟️ FREE EVENT';
    if (event.pricing_type === 'Free with RSVP') return '🎟️ FREE (RSVP Required)';
    return '💵 PAID EVENT';
  };

  const getPricingColor = () => {
    if (event.pricing_type === 'Free' || event.pricing_type === 'Free with RSVP') return '#06D6A0';
    return '#FF8500';
  };

  const dateLabel = event.event_date ? formatDate(event.event_date) : 'Date TBD';

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const shareUrl = siteUrl ? `${siteUrl}/events/${slug}` : `/events/${slug}`;

  const emailSubject = encodeURIComponent(event.title ?? 'ATX Events Insider event');
  const emailBody = encodeURIComponent(`Check this out:\n\n${shareUrl}`);
  const emailHref = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Analytics tracking (writes only) */}
      <TrackEventView eventId={event.id} pathname={`/events/${slug}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <a
          href="/"
          className="text-gray-600 hover:text-purple-600 flex items-center gap-2 text-sm font-semibold"
        >
          ← Back to Events
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 1) Main content */}
          <div className="order-1 lg:order-1 lg:col-span-8">
            {/* Title + Location + Save button row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#7B2CBF' }}>
                  {event.title ?? 'Untitled Event'}
                </h1>
                <p className="text-xl text-gray-600">📍 {event.location ?? 'Location TBD'}</p>
              </div>

              <div className="shrink-0 pt-1">
                <SaveToggleButton eventId={event.id} />
              </div>
            </div>

            <div className="mb-8">
              <img
                src={
                  event.image_url ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
                }
                alt={event.title ?? 'Event'}
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {event.description || 'Join us for this amazing event in Austin!'}
              </p>
            </div>

            {event.insider_tip && (
              <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-100">
                <a
                  href={KAS_AUTHOR_HREF}
                  className="group flex items-center justify-between gap-3 mb-3"
                >
                  <h3
                    className="text-xl font-bold group-hover:text-purple-700 transition-colors"
                    style={{ color: '#7B2CBF' }}
                  >
                    💡 Insider Tip from Kas
                  </h3>

                  <span className="text-sm font-semibold text-purple-700 group-hover:underline">
                    View bio →
                  </span>
                </a>

                <div className="text-sm text-gray-600">{event.insider_tip}</div>
              </div>
            )}
          </div>

          {/* 2) Sidebar details */}
          <div className="order-2 lg:order-2 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
                  Event Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <span
                      className="px-4 py-2 text-base font-semibold rounded-full text-white inline-block"
                      style={{ backgroundColor: getPricingColor() }}
                    >
                      {getPricingText()}
                    </span>
                  </div>

                  <RSVPWidget eventId={event.id} returnTo={`/events/${slug}`} />



                  {vibeTags.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">✨ Vibe</div>
                      <div className="flex flex-wrap gap-2">
                        {vibeTags.slice(0, 3).map((v) => (
                          <span
                            key={v}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                          >
                            {formatVibe(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-500 mb-1">📅 Date</div>
                    <div className="font-semibold">{dateLabel}</div>
                  </div>

                  {event.time && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">🕐 Time</div>
                      <div className="font-semibold">{event.time}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-500 mb-1">📍 Location</div>
                    <div className="font-semibold">{event.location ?? 'Location TBD'}</div>
                    {event.neighborhood && (
                      <div className="text-sm text-gray-600">{event.neighborhood}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">🎭 Category</div>
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                      {event.event_type ?? 'Uncategorized'}
                    </span>
                  </div>

                  {event.price && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">💵 Price</div>
                      <div className="font-semibold">{event.price}</div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {event.instagram_url && (
                    <TrackedOutboundLink
                      eventId={event.id}
                      href={event.instagram_url}
                      kind="instagram"
                      pathname={`/events/${slug}`}
                      className="block w-full py-3 text-center font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      📲 View on Instagram
                    </TrackedOutboundLink>
                  )}

                  {/* If you add a ticket link later, use kind="ticket" to track "Ticket clicks" */}
                  {/* {event.ticket_url && (
                    <TrackedOutboundLink
                      eventId={event.id}
                      href={event.ticket_url}
                      kind="ticket"
                      pathname={`/events/${slug}`}
                      className="block w-full py-3 text-center font-semibold rounded-lg bg-gray-900 text-white hover:opacity-90 transition-opacity"
                    >
                      🎟️ Get Tickets
                    </TrackedOutboundLink>
                  )} */}
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold mb-3" style={{ color: '#FF006E' }}>
                  Share This Event
                </h3>
                <div className="flex gap-3">
                  <CopyLinkButton url={shareUrl} />
                  <a
                    href={emailHref}
                    className="flex-1 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-center"
                  >
                    📧 Email
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3) Similar events */}
          {similarEvents.length > 0 && (
            <div className="order-3 lg:order-3 lg:col-span-8 lg:col-start-1">
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B2CBF' }}>
                Similar Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {similarEvents.map((similarEvent) => (
                  <EventCard key={similarEvent.id} event={similarEvent} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
