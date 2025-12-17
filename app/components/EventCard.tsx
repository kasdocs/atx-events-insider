import Link from 'next/link';

export default function EventCard({ event }: { event: any }) {
  // Format the date nicely
  const formatDate = (dateString: string) => {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get pricing tag based on pricing_type
  const getPricingTag = () => {
    if (event.pricing_type === 'Free') {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full text-white" style={{ backgroundColor: '#06D6A0' }}>
          🎟️ FREE
        </span>
      );
    } else if (event.pricing_type === 'Free with RSVP') {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full text-white" style={{ backgroundColor: '#06D6A0' }}>
          🎟️ FREE (RSVP)
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full text-white" style={{ backgroundColor: '#FF8500' }}>
          💵 PAID
        </span>
      );
    }
  };

  const vibeTags: string[] = Array.isArray(event.vibe) ? event.vibe : [];
  const titleCase = (s: string) =>
  s
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const formatVibe = (v: string) => titleCase(v);


  return (
    <Link href={`/events/${event.slug}`}>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        {/* Event Name & Location */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{event.title}</h3>
          <p className="text-gray-600 text-sm">📍 {event.location}</p>
        </div>

        {/* Event Image */}
        <div className="aspect-square bg-gray-200 relative">
          <img
            src={event.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Tags */}
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

        {/* Date/Time + View Details on same line */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            📅 {formatDate(event.event_date)} {event.time && `• 🕐 ${event.time}`}
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
