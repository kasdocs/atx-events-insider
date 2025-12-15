'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import EventCard from '@/app/components/EventCard';
import { supabase } from '@/lib/supabase';

export default function BrowseContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedDate !== '' || 
           selectedNeighborhood !== 'all' || 
           selectedType !== 'all' || 
           selectedCost !== 'all' || 
           dateRange !== null;
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
      <div className="bg-gradient-to-b from-purple-50 to-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: '#7B2CBF'}}>
            Browse Events
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Find the perfect event for you in Austin
          </p>
        </div>
      </div>

      {/* Organizer CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 md:p-6 border border-purple-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base md:text-lg mb-1" style={{color: '#7B2CBF'}}>
              Event Organizer?
            </h3>
            <p className="text-sm text-gray-700">
              Get your event featured on ATX Events Insider
            </p>
          </div>
          
           <a href="/submit-event"
            className="w-full md:w-auto px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap text-center"
            style={{backgroundColor: '#FF006E'}}
          >
            Submit Your Event →
          </a>
        </div>
      </div>

      {/* Filters Section - Collapsible on Mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-16 shadow-sm" style={{ zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
          
          {/* Mobile Filter Toggle Button */}
          <div className="md:hidden py-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full flex items-center justify-between py-3 px-4 bg-purple-50 rounded-lg"
            >
              <span className="font-semibold" style={{color: '#7B2CBF'}}>
                🔍 Filters {hasActiveFilters() && `(${filteredEvents.length})`}
              </span>
              <svg 
                className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{color: '#7B2CBF'}}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filters Grid */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block py-4 md:py-6`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              
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
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                >
                  <option value="all">All Events</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
            </div>

            {/* Active Filter Display & Clear Button */}
            <div className="mt-3 md:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              {dateRange && (
                <span className="text-xs md:text-sm text-gray-600">
                  Showing events from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
                </span>
              )}
              
              {hasActiveFilters() && (
                <button
                  onClick={() => {
                    clearFilters();
                    setFiltersOpen(false);
                  }}
                  className="text-sm font-semibold hover:underline"
                  style={{color: '#FF006E'}}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events by Date */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : sortedDates.length > 0 ? (
          <>
            <div className="mb-4 md:mb-6">
              <p className="text-sm md:text-base text-gray-600">
                Showing <span className="font-semibold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {sortedDates.map((date, index) => (
              <div key={date} className="mb-8 md:mb-12">
                {/* Sticky Date Header - Adjusted for mobile */}
                <div 
                  className="sticky bg-white pt-4 md:pt-8 pb-3 md:pb-4 mb-4 md:mb-6 border-b-2"
                  style={{
                    borderColor: '#7B2CBF',
                    top: filtersOpen ? '345px' : '245px',
                    zIndex: 45,
                    marginLeft: '-1rem',
                    marginRight: '-1rem',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <h2 className="text-xl md:text-2xl font-bold" style={{color: '#7B2CBF'}}>
                    {formatDateHeader(date)}
                  </h2>
                </div>

                {/* Events Grid for this date */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {groupedEvents[date].map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No events found</p>
            <p className="text-sm md:text-base text-gray-500">Try adjusting your filters</p>
            <button
              onClick={() => {
                clearFilters();
                setFiltersOpen(false);
              }}
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