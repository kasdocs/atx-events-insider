import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  
  // Fetch the specific event
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Fetch similar events (same type, exclude current)
  const { data: similarEvents } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', event.event_type)
    .neq('id', id)
    .limit(3);

  // Format the date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
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
            <h1 className="text-4xl font-bold mb-2" style={{color: '#7B2CBF'}}>
              {event.name}
            </h1>
            <p className="text-xl text-gray-600 mb-6">📍 {event.venue}</p>

            {/* Instagram Post Image */}
            <div className="mb-8">
              <img 
                src={event.image_url} 
                alt={event.name}
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            {/* About This Event */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{color: '#7B2CBF'}}>
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {event.description || 'Join us for this amazing event in Austin!'}
              </p>
            </div>

            {/* What to Expect */}
            <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-100">
              <h3 className="text-xl font-bold mb-3" style={{color: '#7B2CBF'}}>
                💡 Insider Tip from Kas
              </h3>
              <p className="text-gray-700">
                This is a great event for locals and visitors alike! {event.is_free ? "Best part? It's completely free!" : "Worth every penny!"}
              </p>
            </div>

            {/* Similar Events */}
            {similarEvents && similarEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{color: '#7B2CBF'}}>
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
                <h3 className="text-xl font-bold mb-4" style={{color: '#7B2CBF'}}>
                  Event Details
                </h3>
                
                <div className="space-y-4">
                  {/* Free/Paid Badge */}
                  <div>
                    {event.is_free ? (
                      <span className="px-4 py-2 text-base font-semibold rounded-full text-white inline-block" style={{backgroundColor: '#06D6A0'}}>
                        🎟️ FREE EVENT
                      </span>
                    ) : (
                      <span className="px-4 py-2 text-base font-semibold rounded-full text-white inline-block" style={{backgroundColor: '#FF8500'}}>
                        💵 PAID EVENT
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">📅 Date</div>
                    <div className="font-semibold">{formatDate(event.event_date)}</div>
                  </div>

                  {/* Time */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">🕐 Time</div>
                    <div className="font-semibold">{event.event_time}</div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">📍 Location</div>
                    <div className="font-semibold">{event.venue}</div>
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
                </div>

                {/* CTAs */}
                <div className="mt-6 space-y-3">
                  <a 
                    href={event.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 text-center font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{backgroundColor: '#7B2CBF'}}
                  >
                    📲 View on Instagram
                  </a>
                  
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
                <h3 className="text-lg font-bold mb-3" style={{color: '#FF006E'}}>
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