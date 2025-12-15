'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import { supabase } from '@/lib/supabase';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCost, setSelectedCost] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle URL parameters from Quick Jump
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const weekendParam = searchParams.get('weekend');
    const nextWeekParam = searchParams.get('nextweek');

    if (dateParam) {
      setSelectedDate(dateParam);
      setDateRange(null);
    } else if (weekendParam === 'true') {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      let daysUntilSaturday = 6 - dayOfWeek;
      if (dayOfWeek === 0) daysUntilSaturday = 6;
      if (dayOfWeek === 6) daysUntilSaturday = 0;
      
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSaturday);
      
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      
      setDateRange({
        start: saturday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
      });
      setSelectedDate('');
    } else if (nextWeekParam === 'true') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      setDateRange({
        start: tomorrow.toISOString().split('T')[0],
        end: weekFromNow.toISOString().split('T')[0]
      });
      setSelectedDate('');
    }
  }, [searchParams]);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [events, selectedDate, selectedNeighborhood, selectedType, selectedCost, dateRange]);

  const fetchEvents = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (dateRange) {
      filtered = filtered.filter(event => 
        event.event_date >= dateRange.start && event.event_date <= dateRange.end
      );
    } else if (selectedDate) {
      filtered = filtered.filter(event => event.event_date === selectedDate);
    }

    if (selectedNeighborhood !== 'all') {
      filtered = filtered.filter(event => event.neighborhood === selectedNeighborhood);
    }

    if (selectedType !== 'all') {
      const mainTypeMatches = filtered.filter(event => event.event_type === selectedType);
      const subtypeMatches = filtered.filter(event => 
        event.event_type !== selectedType && (
          event.subtype_1 === selectedType ||
          event.subtype_2 === selectedType ||
          event.subtype_3 === selectedType
        )
      );
      
      filtered = [...mainTypeMatches, ...subtypeMatches];
    }

    if (selectedCost === 'free') {
      filtered = filtered.filter(event => event.pricing_type === 'Free');
    } else if (selectedCost === 'paid') {
      filtered = filtered.filter(event => event.pricing_type === 'Ticketed' || event.pricing_type === 'Free with RSVP');
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedNeighborhood('all');
    setSelectedType('all');
    setSelectedCost('all');
    setDateRange(null);
  };

  // Group events by date
  const groupEventsByDate = (events: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    events.forEach(event => {
      const date = event.event_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    return grouped;
  };

  // Format date for section headers
  const formatDateHeader = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  const neighborhoods = Array.from(new Set(events.map(e => e.neighborhood).filter(Boolean)));
  const eventTypes = Array.from(new Set(events.map(e => e.event_type).filter(Boolean)));

  const groupedEvents = groupEventsByDate(filteredEvents);
  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2" style={{color: '#7B2CBF'}}>
            Browse Events
          </h1>
          <p className="text-lg text-gray-600">
            Find the perfect event for you in Austin
          </p>
        </div>
      </div>

      {/* Organizer CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border border-purple-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1" style={{color: '#7B2CBF'}}>
              Event Organizer?
            </h3>
            <p className="text-sm text-gray-700">
              Get your event featured on ATX Events Insider and reach thousands of Austinites
            </p>
          </div>
          
           <a href="/submit-event"
            className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{backgroundColor: '#FF006E'}}
          >
            Submit Your Event →
          </a>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: '#7B2CBF'}}>
                📅 Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateRange(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Neighborhood Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: '#7B2CBF'}}>
                📍 Neighborhood
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Neighborhoods</option>
                {neighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: '#7B2CBF'}}>
                🎭 Event Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: '#7B2CBF'}}>
                💵 Cost
              </label>
              <select
                value={selectedCost}
                onChange={(e) => setSelectedCost(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Events</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>
          </div>

          {/* Active Filter Display */}
          {dateRange && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing events from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
              </span>
              <button
                onClick={clearFilters}
                className="text-sm font-semibold hover:underline"
                style={{color: '#FF006E'}}
              >
                Clear
              </button>
            </div>
          )}

          {/* Clear Filters Button */}
          {!dateRange && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm font-semibold hover:underline"
                style={{color: '#FF006E'}}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Events by Date */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : sortedDates.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {sortedDates.map((date) => (
              <div key={date} className="mb-12">
                {/* Sticky Date Header */}
                <div className="sticky top-[200px] z-30 bg-white pt-8 pb-4 mb-6 border-b-2" style={{borderColor: '#7B2CBF'}}>
                  <h2 className="text-2xl font-bold" style={{color: '#7B2CBF'}}>
                    {formatDateHeader(date)}
                  </h2>
                </div>

                {/* Events Grid for this date */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedEvents[date].map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl font-semibold text-gray-600 mb-2">No events found</p>
            <p className="text-gray-500">Try adjusting your filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 rounded-lg text-white font-semibold hover:opacity-90"
              style={{backgroundColor: '#7B2CBF'}}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
}