import Link from 'next/link';
import type { Database } from '@/lib/database.types';
import SaveToggleButton from '@/app/components/SaveToggleButton';

type EventRow = Database['public']['Tables']['events']['Row'];

export default function EventCard({
  event,
  goingCount,
  featured = false,
}: {
  event: EventRow;
  goingCount?: number;
  featured?: boolean;
}) {
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getPricingTag = () => {
    if (event.pricing_type === 'Free') {
      return (
        <span
          className="px-3 py-1 text-sm font-semibold rounded-full text-white"
          style={{ backgroundColor: '#06D6A0' }}
        >
          🎟️ FREE
        </span>
      );
    }

    if (event.pricing_type === 'Free with RSVP') {
      return (
        <span
          className="px-3 py-1 text-sm font-semibold rounded-full text-white"
          style={{ backgroundColor: '#06D6A0' }}
        >
          🎟️ FREE (RSVP)
        </span>
      );
    }

    return (
      <span
        className="px-3 py-1 text-sm font-semibold rounded-full text-white"
        style={{ backgroundColor: '#FF8500' }}
      >
        💵 PAID
      </span>
    );
  };

  const vibeTags: string[] = Array.isArray(event.vibe) ? event.vibe : [];

  const titleCase = (s: string) =>
    s
      .replaceAll('_', ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const formatVibe = (v: string) => titleCase(v);

  const locationLine = () => {
    const loc = (event.location ?? '').trim();
    const hood = (event.neighborhood ?? '').trim();

    if (loc && hood) return `📍 ${loc}, ${hood}`;
    if (loc) return `📍 ${loc}`;
    if (hood) return `📍 ${hood}`;
    return '📍 Location TBD';
  };

  const showGoing = typeof goingCount === 'number' && goingCount > 0;

  // Featured gradient ring that blends into white background
const featuredRing = featured
  ? [
      'relative',
      "before:content-[''] before:pointer-events-none before:absolute before:-inset-[12px] before:rounded-[22px] before:-z-10",
      "before:bg-[radial-gradient(closest-side,rgba(123,44,191,0.28),rgba(255,0,110,0.14),transparent_72%)]",
    ].join(' ')
  : '';


  const featuredBorder = featured ? 'border-purple-200' : 'border-gray-200';
  const hoverShadow = featured ? 'hover:shadow-xl' : 'hover:shadow-lg';

  return (
    <Link href={`/events/${event.slug}`} className="block">
      <div
        className={[
          'bg-white border rounded-xl transition-shadow duration-300 cursor-pointer',
          featuredRing,
          featuredBorder,
          hoverShadow,
        ].join(' ')}
      >
        {/* Header row: title/location left, save button right */}
        <div className="p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {featured ? (
              <div className="mb-2">
                <span
                  className="inline-flex items-center px-3 py-1 text-xs font-extrabold rounded-full text-white"
                  style={{ backgroundColor: '#7B2CBF' }}
                >
                  ⭐ Featured
                </span>
              </div>
            ) : null}

            <h3 className="font-bold text-lg mb-1 truncate">{event.title}</h3>
            <p className="text-gray-600 text-sm truncate">{locationLine()}</p>

            {showGoing ? (
              <div className="mt-2 text-xs text-gray-600 font-semibold">👥 {goingCount} going</div>
            ) : null}
          </div>

          {/* Save/Unsave button */}
          {typeof event.id === 'number' ? (
            <div className="shrink-0">
              <SaveToggleButton eventId={event.id} />
            </div>
          ) : null}
        </div>

        {/* Flyer image (keep overflow hidden here, not on the outer card) */}
        <div className="aspect-square bg-gray-200 overflow-hidden rounded-b-none">
          <img
            src={
              event.image_url ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
            }
            alt={event.title ?? 'Event image'}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {getPricingTag()}

            {vibeTags.slice(0, 3).map((vibe) => (
              <span key={vibe} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                {formatVibe(vibe)}
              </span>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            📅 {event.event_date ? formatDate(event.event_date) : 'TBD'}{' '}
            {event.time ? `• 🕐 ${event.time}` : ''}
          </p>

          <span
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: '#7B2CBF' }}
          >
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
