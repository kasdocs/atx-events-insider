import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import Sidebar from './components/Sidebar';
import { supabase } from '@/lib/supabase';
import FeaturedStoryHero from '@/app/components/FeaturedStoryHero';

export default async function Home() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Get the next weekend date range (Friday-Sunday)
  const getNextWeekend = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    let daysUntilFriday;
    if (currentDay <= 5) {
      // If today is Monday-Friday, get this week's Friday
      daysUntilFriday = 5 - currentDay;
    } else {
      // If today is Saturday or Sunday, get next week's Friday
      daysUntilFriday = 5 + (7 - currentDay);
    }
    
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(0, 0, 0, 0);
    
    const nextSunday = new Date(nextFriday);
    nextSunday.setDate(nextFriday.getDate() + 2);
    nextSunday.setHours(23, 59, 59, 999);
    
    return {
      friday: nextFriday.toISOString().split('T')[0],
      sunday: nextSunday.toISOString().split('T')[0]
    };
  };

  const weekend = getNextWeekend();

  // Fetch only upcoming events from Supabase
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today) // Greater than or equal to today
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
  }

  // Filter free events for the upcoming weekend
  const freeEvents = events?.filter(event => {
    const eventDate = event.event_date;
    const isFreeOrRSVP = event.pricing_type === 'Free' || event.pricing_type === 'Free with RSVP';
    const isWeekend = eventDate >= weekend.friday && eventDate <= weekend.sunday;
    return isFreeOrRSVP && isWeekend;
  }) || [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Featured Story Hero */}
      <FeaturedStoryHero />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4" style={{color: '#7B2CBF'}}>
            Discover Austin's Best Events
          </h1>
          <p className="text-xl text-gray-600">
            Curated by Kas, your local events insider
          </p>
        </div>
      </div>
      
      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content - 70% */}
          <div className="lg:col-span-8">
            {/* Free This Weekend Section */}
            <h2 className="text-3xl font-bold mb-8" style={{color: '#FF006E'}}>
              🎟️ Free This Weekend
            </h2>
            
            {freeEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {freeEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mb-12">No free events found. Check back soon!</p>
            )}

            {/* All Events Section */}
            <h2 className="text-3xl font-bold mb-8" style={{color: '#7B2CBF'}}>
              🔥 Featured Events
            </h2>
            
            {events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No events found. Check back soon!</p>
            )}
          </div>

          {/* Sidebar - 30% */}
          <div className="lg:col-span-4">
            <Sidebar />
          </div>

        </div>
      </div>
    </div>
  );
}