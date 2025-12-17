import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params (Next.js 15 requirement)
  const { slug } = await params;

  // Fetch the specific event by slug
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !event) {
    notFound();
  }

  // Fetch similar events (same type, exclude current)
  const { data: similarEvents } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', event.event_type)
    .neq('slug', slug)
    .limit(3);

  // Format the date nicely
  const formatDate = (dateString: string) => {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Vibe formatting
  const titleCase = (s: string) =>
    s
      .replaceAll('_', ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const vibeTags: string[] = Array.isArray(event?.vibe) ? event.vibe : [];
  const formatVibe = (v: string) => titleCase(v);

  // Get pricing tag text
  const getPricingText = () => {
    if (event.pricing_type === 'Free') return '🎟️ FREE EVENT';
    if (event.pricing_type === 'Free with RSVP') return '🎟️ FREE (RSVP Required)';
    return '💵 PAID EVENT';
  };

  const getPricingColor = () => {
    if (event.pricing_type === 'Free' || event.pricing_type === 'Free with RSVP') {
      return '#06D6A0';
    }
    return '#FF8500';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <a
          href="/"
          className="text-gray-600 hover:text-purple-600 flex items-center gap-2 text-sm font-semibold"
        >
          ← Back to Events
        </a>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content - 65% */}
          <div className="lg:col-span-8">
            {/* Event Title */}
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#7B2CBF' }}>
              {event.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">📍 {event.location}</p>

            {/* Event Image */}
            <div className="mb-8">
              <img
                src={event.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
                alt={event.title}
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            {/* About This Event */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {event.description || 'Join us for this amazing event in Austin!'}
              </p>
            </div>

            {/* Insider Tip */}
            {event.insider_tip && (
              <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="text-xl font-bold mb-3" style={{ color: '#7B2CBF' }}>
                  💡 Insider Tip from Kas
                </h3>
                <div className="text-sm text-gray-600">{event.insider_tip}</div>
              </div>
            )}

            {/* Similar Events */}
            {similarEvents && similarEvents.length > 0 && (
              <div>
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

          {/* Sidebar - 35% */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">

              {/* Event Details Card */}
              <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
                  Event Details
                </h3>

                <div className="space-y-4">
                  {/* Pricing Badge */}
                  <div>
                    <span
                      className="px-4 py-2 text-base font-semibold rounded-full text-white inline-block"
                      style={{ backgroundColor: getPricingColor() }}
                    >
                      {getPricingText()}
                    </span>
                  </div>

                  {/* NEW: Vibes */}
                  {vibeTags.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">✨ Vibe</div>
                      <div className="flex flex-wrap gap-2">
                        {vibeTags.slice(0, 3).map((v) => (
                          <span key={v} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                            {formatVibe(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">📅 Date</div>
                    <div className="font-semibold">{formatDate(event.event_date)}</div>
                  </div>

                  {/* Time */}
                  {event.time && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">🕐 Time</div>
                      <div className="font-semibold">{event.time}</div>
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">📍 Location</div>
                    <div className="font-semibold">{event.location}</div>
                    {event.neighborhood && (
                      <div className="text-sm text-gray-600">{event.neighborhood}</div>
                    )}
                  </div>

                  {/* Event Type */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">🎭 Category</div>
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                      {event.event_type}
                    </span>
                  </div>

                  {/* Price Details */}
                  {event.price && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">💵 Price</div>
                      <div className="font-semibold">{event.price}</div>
                    </div>
                  )}
                </div>

                {/* CTAs */}
                <div className="mt-6 space-y-3">
                  {event.instagram_url && (
                    <a
                      href={event.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 text-center font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#7B2CBF' }}
                    >
                      📲 View on Instagram
                    </a>
                  )}

                  <button
                    className="w-full py-3 text-center font-semibold rounded-lg border-2 transition-colors hover:bg-purple-50"
                    style={{
                      borderColor: '#7B2CBF',
                      color: '#7B2CBF'
                    }}
                  >
                    🔖 Save Event
                  </button>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold mb-3" style={{ color: '#FF006E' }}>
                  Share This Event
                </h3>
                <div className="flex gap-3">
                  <button className="flex-1 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold">
                    📱 Copy Link
                  </button>
                  <button className="flex-1 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold">
                    📧 Email
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
