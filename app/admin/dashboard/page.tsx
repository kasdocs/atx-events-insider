'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const ORGANIZER_INQUIRY_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
] as const;

type OrganizerInquiryStatus = (typeof ORGANIZER_INQUIRY_STATUS_OPTIONS)[number]['value'];


const formatEventLabel = (event: { title: string; event_date?: string | null }) => {
  if (!event.event_date) return event.title;

  // YYYY-MM-DD
  const date = new Date(event.event_date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} · ${event.title}`;
};


export const VIBE_OPTIONS = [
  { value: "good_for_groups", label: "Good for Groups" },
  { value: "meet_people", label: "Meet People" },
  { value: "date_night", label: "Date Night" },
  { value: "family_friendly", label: "Family-friendly" },
  { value: "kid_friendly", label: "Kid-friendly" },
  { value: "pet_friendly", label: "Pet-friendly" },
  { value: "low_key", label: "Low Key" },
  { value: "high_energy", label: "High Energy" },
  { value: "chill", label: "Chill" },
  { value: "cozy", label: "Cozy" },
  { value: "dancey", label: "Dancey" },
  { value: "live_music", label: "Live Music" },
  { value: "dj_set", label: "DJ Set" },
  { value: "late_night", label: "Late Night" },
  { value: "food_trucks_nearby", label: "Food Trucks Nearby" },
  { value: "for_the_foodies", label: "For the Foodies" },
  { value: "coffee_hang", label: "Coffee Hang" },
  { value: "dessert_run", label: "Dessert Run" },
  { value: "outdoor_hang", label: "Outdoor Hang" },
  { value: "sweat_level_light", label: "Sweat Level Light" },
  { value: "sweat_level_real", label: "Sweat Level Real" },
  { value: "artsy", label: "Artsy" },
  { value: "makers", label: "Makers" },
  { value: "diy", label: "DIY" },
  { value: "nerdy", label: "Nerdy" },
  { value: "vintage", label: "Vintage" },
  { value: "thrifty", label: "Thrifty" },
  { value: "grounding", label: "Grounding" },
  { value: "soft_morning", label: "Soft Morning" },
  { value: "beginner_friendly", label: "Beginner Friendly" },
  { value: "civic_action", label: "Civic Action" },
  { value: "protest", label: "Protest" },
] as const;

type VibeValue = (typeof VIBE_OPTIONS)[number]["value"];

type Event = {
  id: number;
  title: string;
  event_date: string;
  location: string;
  event_type: string;
  vibe?: VibeValue[];
  subtype_1?: string;
  subtype_2?: string;
  slug?: string;
  subtype_3?: string;
  neighborhood?: string;
  pricing_type: string;
  description?: string;
  image_url?: string;
  price?: string;
  time?: string;
  instagram_url?: string;
  insider_tip?: string;
};

type Story = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  story_type?: string;
  author?: string | null;
  author_id?: string | null;
  published_date: string;
  event_id?: number;
  featured: boolean;
};

type Author = {
  id: string; // uuid
  name: string;
  slug: string;
  bio?: string | null;
  favorite_event_type?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};


const story_type = [
  'Event Recap',
  'Venue Spotlight',
  'Interview',
  'Neighborhood Guide',
  'Tips & Guides',
  'Seasonal Roundup',
  'Hidden Gems',
  'Food & Drink Focus',
  'Community Stories',
  'Event Preview',
  'Top Lists',
  'News & Announcements'
];

type Subscriber = {
  id: number;
  email: string;
  subscribed_at: string;
  source: string;
  active: boolean;
};

type OrganizerInquiry = {
  id: number | string;
  created_at?: string;
  status?: string;

  name?: string;
  email?: string;
  phone?: string;

  event_name?: string;
  event_date?: string;
  event_description?: string;

  package_interest?: string;
  goals_and_questions?: string;

  [key: string]: any;
};


type FeaturedRow = {
  id: string;
  event_id: number;
  rank: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  events?: {
    id: number;
    title: string;
    event_date?: string;
    location?: string;
    vibe?: string[];
    pricing_type?: string;
    price?: string | null;
    time?: string | null;
  } | null;
};

function formatVibeLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function formatDateTimeMaybe(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildEventSlug(title: string, eventDate: string) {
  const datePart = (eventDate || '').slice(0, 10);
  const base = slugify(title);
  return datePart ? `${base}-${datePart}` : base;
}

function pickFirst(...values: Array<string | undefined | null>) {
  for (const v of values) {
    if (v && String(v).trim().length > 0) return String(v);
  }
  return '';
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/admin/check-auth');
      if (!response.ok) {
        router.push('/admin');
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">ATX Events Admin</h1>
          <div className="flex gap-4">
            <a href="/" target="_blank" className="px-4 py-2 text-gray-600 hover:text-purple-600">View Site</a>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b flex flex-wrap">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-4 font-semibold ${activeTab === 'events' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Events
            </button>

            <button
              onClick={() => setActiveTab('featured')}
              className={`px-6 py-4 font-semibold ${activeTab === 'featured' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Featured
            </button>

            <button
              onClick={() => setActiveTab('stories')}
              className={`px-6 py-4 font-semibold ${activeTab === 'stories' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Stories
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-6 py-4 font-semibold ${activeTab === 'subscribers' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Newsletter Subscribers
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-4 font-semibold ${activeTab === 'submissions' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('organizer_inquiries')}
              className={`px-6 py-4 font-semibold ${activeTab === 'organizer_inquiries' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Organizer Inquiries
            </button>
            <button
  onClick={() => setActiveTab('authors')}
  className={`px-6 py-4 font-semibold ${activeTab === 'authors' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
>
  Authors
</button>

          </div>

          <div className="p-6">
            {activeTab === 'events' && <EventsManager />}
            {activeTab === 'featured' && <FeaturedManager />}
            {activeTab === 'stories' && <StoriesManager />}
            {activeTab === 'subscribers' && <SubscribersManager />}
            {activeTab === 'authors' && <AuthorsManager />}
            {activeTab === 'submissions' && <SubmissionsManager />}
            {activeTab === 'organizer_inquiries' && <OrganizerInquiriesManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
/* --------------------------- Events Manager --------------------------- */

function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [sortField, setSortField] = useState<'event_date'>('event_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      console.log('Fetched events:', data);
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
    setLoading(false);
  };

  const handleSort = (field: 'event_date') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aDate = new Date(a.event_date).getTime();
      const bDate = new Date(b.event_date).getTime();
      
      if (sortDirection === 'asc') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    });
    return sorted;
  }, [events, sortField, sortDirection]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    fetchEvents();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
    fetchEvents();
  };

  if (loading) {
    return <div className="text-gray-600">Loading events...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Manage Events</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + Add New Event
        </button>
      </div>

      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={handleFormClose}
        />
      )}

      {!showForm && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('event_date')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    <span className="text-xs">
                      {sortField === 'event_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vibe</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pricing</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedEvents.map((event) => {
                const primaryVibe = event.vibe?.[0];
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{event.title}</td>
                    <td className="px-4 py-3 text-sm">{new Date(event.event_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{event.location}</td>
                    <td className="px-4 py-3 text-sm">
                      {primaryVibe ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {formatVibeLabel(primaryVibe)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          none
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {event.pricing_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No events yet. Click "Add New Event" to create one!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventForm({ event, onClose }: { event: Event | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    event_date: event?.event_date || '',
    time: event?.time || '',
    location: event?.location || '',
    event_type: event?.event_type || 'Music',
    vibe: (event?.vibe || []) as VibeValue[],
    subtype_1: event?.subtype_1 || '',
    subtype_2: event?.subtype_2 || '',
    subtype_3: event?.subtype_3 || '',
    slug: event?.slug || '',
    neighborhood: event?.neighborhood || '',
    pricing_type: event?.pricing_type || 'Free',
    description: event?.description || '',
    image_url: event?.image_url || '',
    price: event?.price || '',
    instagram_url: event?.instagram_url || '',
    insider_tip: event?.insider_tip || ''
  });
  const [saving, setSaving] = useState(false);

  const eventTypes = [
    'Music',
    'Food & Drink',
    'Art & Culture',
    'Nightlife',
    'Sports & Fitness',
    'Market',
    'Community',
    'Comedy',
    'Festival',
    'Film & Theater',
    'Wellness',
    'Political & Activism',
    'Networking & Social',
    'Coffee & Tea',
    'Education & Workshops',
    'Outdoors & Nature',
  ];

  const neighborhoods = [
    'Downtown',
    'East Austin',
    'South Austin',
    'North Austin',
    'West Austin',
    'Central',
    'Rainey Street',
    '6th Street',
    'Domain',
    'Mueller',
    'Zilker',
    'Other'
  ];

  const pricingTypes = ['Free', 'Free with RSVP', 'Ticketed'];

  const toggleVibe = (value: VibeValue) => {
    setFormData((prev) => {
      const current = prev.vibe ?? [];
      const exists = current.includes(value);

      if (exists) {
        return { ...prev, vibe: current.filter(v => v !== value) };
      }

      if (current.length >= 3) {
        return prev;
      }

      return { ...prev, vibe: [...current, value] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const slug = `${formData.title}-${formData.event_date}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const dataToSubmit = { ...formData, slug };

    const url = event ? `/api/admin/events/${event.id}` : '/api/admin/events';
    const method = event ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSubmit),
    });

    setSaving(false);
    onClose();
  };

  const atVibeCap = (formData.vibe?.length ?? 0) >= 3;

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{event ? 'Edit Event' : 'Add New Event'}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Event Type *</label>
          <select
            required
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">Vibe (max 3)</label>
            <span className="text-xs text-gray-500">
              Selected: {formData.vibe?.length ?? 0}/3
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-white border border-gray-200 rounded-lg p-3">
            {VIBE_OPTIONS.map(({ value, label }) => {
              const checked = (formData.vibe ?? []).includes(value);
              return (
                <label key={value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVibe(value)}
                    disabled={!checked && atVibeCap}
                  />
                  {label}
                </label>
              );
            })}
          </div>

          {atVibeCap && (
            <div className="text-xs text-gray-500 mt-2">
              You have hit the limit. Uncheck one to add another.
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Subtype 1</label>
          <select
            value={formData.subtype_1}
            onChange={(e) => setFormData({ ...formData, subtype_1: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">None</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Subtype 2</label>
          <select
            value={formData.subtype_2}
            onChange={(e) => setFormData({ ...formData, subtype_2: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">None</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Subtype 3</label>
          <select
            value={formData.subtype_3}
            onChange={(e) => setFormData({ ...formData, subtype_3: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">None</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Neighborhood</label>
          <select
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select neighborhood</option>
            {neighborhoods.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Date *</label>
          <input
            type="date"
            required
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Time</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Location *</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Pricing Type *</label>
          <select
            required
            value={formData.pricing_type}
            onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {pricingTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Price Details</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="e.g., $20, $15-25"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Image URL</label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Instagram URL</label>
        <input
          type="url"
          value={formData.instagram_url}
          onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
          placeholder="https://instagram.com/p/..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Insider Tip</label>
        <input
          type="text"
          value={formData.insider_tip}
          onChange={(e) => setFormData({ ...formData, insider_tip: e.target.value })}
          placeholder="Share a tip for attendees"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
/* --------------------------- Featured Manager --------------------------- */

function FeaturedManager() {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [rank, setRank] = useState<number>(100);
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const toIsoOrNullFromDateTimeLocal = (v: string) => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const toDateTimeLocalOrEmpty = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [featuredRes, eventsRes] = await Promise.all([
        fetch('/api/admin/featured', { method: 'GET' }),
        fetch('/api/events', { method: 'GET' }),
      ]);

      if (!featuredRes.ok) {
        const err = await featuredRes.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to load featured (${featuredRes.status})`);
      }

      if (!eventsRes.ok) {
        throw new Error(`Failed to load events (${eventsRes.status})`);
      }

      const featuredJson = await featuredRes.json();
      const eventsJson = await eventsRes.json();

      const rows = Array.isArray(featuredJson?.featured) ? featuredJson.featured : [];
      rows.sort((a: FeaturedRow, b: FeaturedRow) => Number(a.rank) - Number(b.rank));

      setFeatured(rows);
      setEvents(Array.isArray(eventsJson) ? eventsJson : []);
    } catch (e) {
      console.error('Featured load error:', e);
      setFeatured([]);
      setEvents([]);
    }
    setLoading(false);
  };

  const addFeatured = async () => {
    if (!selectedEventId) return;

    const payload = {
      action: 'add',
      event_id: Number(selectedEventId),
      rank: Number(rank),
      is_active: true,
      starts_at: toIsoOrNullFromDateTimeLocal(startsAt),
      ends_at: toIsoOrNullFromDateTimeLocal(endsAt),
    };

    setSaving(true);
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to add featured event.');
        setSaving(false);
        return;
      }

      await loadAll();
      setSelectedEventId('');
      setRank(100);
      setStartsAt('');
      setEndsAt('');
    } catch (e) {
      console.error('Add featured error:', e);
      alert('Failed to add featured event.');
    }
    setSaving(false);
  };

  const removeFeatured = async (id: string) => {
    if (!confirm('Remove this featured event?')) return;

    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to remove featured event.');
        return;
      }

      await loadAll();
    } catch (e) {
      console.error('Remove featured error:', e);
      alert('Failed to remove featured event.');
    }
  };

  const toggleActive = async (row: FeaturedRow) => {
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: row.id,
          is_active: !row.is_active,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to update featured event.');
        return;
      }

      await loadAll();
    } catch (e) {
      console.error('Toggle active error:', e);
      alert('Failed to update featured event.');
    }
  };

  const updateRank = async (row: FeaturedRow, newRank: number) => {
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: row.id,
          rank: Number(newRank),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to update rank.');
        return;
      }

      await loadAll();
    } catch (e) {
      console.error('Update rank error:', e);
      alert('Failed to update rank.');
    }
  };

  const updateWindow = async (row: FeaturedRow, nextStartsIso: string | null, nextEndsIso: string | null) => {
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: row.id,
          starts_at: nextStartsIso,
          ends_at: nextEndsIso,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to update schedule window.');
        return;
      }

      await loadAll();
    } catch (e) {
      console.error('Update window error:', e);
      alert('Failed to update schedule window.');
    }
  };

  const moveRow = async (rowId: string, direction: 'up' | 'down') => {
    const sorted = featured.slice().sort((a, b) => Number(a.rank) - Number(b.rank));
    const idx = sorted.findIndex((r) => r.id === rowId);
    if (idx === -1) return;

    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapWith];

    const aRank = Number(a.rank);
    const bRank = Number(b.rank);

    if (!Number.isFinite(aRank) || !Number.isFinite(bRank)) return;

    await updateRank(a, bRank);
  };

  if (loading) return <div className="text-gray-600">Loading featured events...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Featured Events</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add events to the Featured feed shown on the homepage and prioritize them on Browse.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select an event...</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {formatEventLabel(e)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Rank</label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Starts (optional)</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Ends (optional)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={addFeatured}
            disabled={saving || !selectedEventId}
            className="md:col-span-5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Adding...' : '+ Add to Featured'}
          </button>
        </div>

        <div className="text-xs text-gray-600 mt-3">
          Tip: Use Starts/Ends to schedule promos. Leave blank to show all the time.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Event</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Schedule</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {featured
              .slice()
              .sort((a, b) => Number(a.rank) - Number(b.rank))
              .map((row, idx, arr) => {
                const title = row.events?.title || `Event #${row.event_id}`;
                const location = row.events?.location || '';

                const startLocal = toDateTimeLocalOrEmpty(row.starts_at);
                const endLocal = toDateTimeLocalOrEmpty(row.ends_at);

                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveRow(row.id, 'up')}
                          disabled={idx === 0}
                          className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveRow(row.id, 'down')}
                          disabled={idx === arr.length - 1}
                          className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <input
                        type="number"
                        defaultValue={row.rank}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        onBlur={(e) => {
                          const next = Number(e.target.value);
                          if (!Number.isFinite(next) || next === row.rank) return;
                          updateRank(row, next);
                        }}
                      />
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold text-gray-900">{title}</div>
                      {location && <div className="text-xs text-gray-600">{location}</div>}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="grid grid-cols-1 gap-2 min-w-[260px]">
                        <input
                          type="datetime-local"
                          defaultValue={startLocal}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          onBlur={(e) => {
                            const nextStart = e.target.value ? new Date(e.target.value).toISOString() : null;
                            updateWindow(row, nextStart, row.ends_at);
                          }}
                        />
                        <input
                          type="datetime-local"
                          defaultValue={endLocal}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          onBlur={(e) => {
                            const nextEnd = e.target.value ? new Date(e.target.value).toISOString() : null;
                            updateWindow(row, row.starts_at, nextEnd);
                          }}
                        />
                        <div className="text-xs text-gray-500">Leave blank to show always.</div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {row.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Inactive</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleActive(row)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => removeFeatured(row.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {featured.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No featured events yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
/* --------------------------- Stories Manager --------------------------- */

function StoriesManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [sortField, setSortField] = useState<'published_date'>('published_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [authors, setAuthors] = useState<Author[]>([]);


  useEffect(() => {
    fetchStories();
    fetchAuthors();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stories');
      const data = await response.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    }
    setLoading(false);
  };

  const authorsById = useMemo(() => {
  const map = new Map<string, Author>();
  for (const a of authors) map.set(a.id, a);
  return map;
}, [authors]);


  const handleSort = (field: 'published_date') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const fetchAuthors = async () => {
  try {
    const res = await fetch('/api/authors');
    const data = await res.json();
    setAuthors(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('Error fetching authors:', e);
    setAuthors([]);
  }
};


  const sortedStories = useMemo(() => {
    const sorted = [...stories].sort((a, b) => {
      const aDate = new Date(a.published_date).getTime();
      const bDate = new Date(b.published_date).getTime();
      
      if (sortDirection === 'asc') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    });
    return sorted;
  }, [stories, sortField, sortDirection]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
    fetchStories();
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingStory(null);
    fetchStories();
  };

  if (loading) {
    return <div className="text-gray-600">Loading stories...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Manage Stories</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + Add New Story
        </button>
      </div>

      {showForm && (
      <StoryForm story={editingStory} onClose={handleFormClose} authors={authors} />

      )}

      {!showForm && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('published_date')}
                >
                  <div className="flex items-center gap-2">
                    Published Date
                    <span className="text-xs">
                      {sortField === 'published_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Featured</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedStories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{story.title}</td>
                  <td className="px-4 py-3 text-sm">
  {story.author_id && authorsById.get(story.author_id)?.name
    ? authorsById.get(story.author_id)!.name
    : (story.author || '—')}
</td>

                  <td className="px-4 py-3 text-sm">{new Date(story.published_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {story.featured ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">⭐ Featured</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Standard</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleEdit(story)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(story.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No stories yet. Click "Add New Story" to create one!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StoryForm({
  story,
  onClose,
  authors,
}: {
  story: Story | null;
  onClose: () => void;
  authors: Author[];
}) {

const [formData, setFormData] = useState({
  title: story?.title || '',
  slug: story?.slug || '',
  excerpt: story?.excerpt || '',
  content: story?.content || '',
  author_id: story?.author_id || null,
  cover_image: story?.cover_image || '',
  published_date: story?.published_date || new Date().toISOString().split('T')[0],
  featured: story?.featured || false,
  story_type: story?.story_type || '',
  event_id: story?.event_id || null,
});

  const [saving, setSaving] = useState(false);

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const url = story ? `/api/admin/stories/${story.id}` : '/api/admin/stories';
    const method = story ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setSaving(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{story ? 'Edit Story' : 'Add New Story'}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-2 text-gray-700">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Slug *</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="auto-generated-from-title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

       <div>
  <label className="block text-sm font-semibold mb-2 text-gray-700">Author *</label>
  <select
    required
    value={formData.author_id ?? ''}
    onChange={(e) =>
      setFormData({ ...formData, author_id: e.target.value ? e.target.value : null })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
  >
    <option value="">Select an author</option>
    {authors.map((a) => (
      <option key={a.id} value={a.id}>
        {a.name}
      </option>
    ))}
  </select>
</div>


        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Published Date *</label>
          <input
            type="date"
            required
            value={formData.published_date}
            onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-semibold text-gray-700">Featured Story</label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Excerpt</label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          rows={2}
          placeholder="Short description for story cards..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Story Type</label>
        <select
          value={formData.story_type || ''}
          onChange={(e) => setFormData({ ...formData, story_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Select Story Type</option>
          {story_type.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Content *</label>
        <textarea
          required
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={10}
          placeholder="Full story content..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Cover Image URL</label>
        <input
          type="url"
          value={formData.cover_image}
          onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : story ? 'Update Story' : 'Create Story'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


/* ------------------------ Subscribers Manager ------------------------ */

function SubscribersManager() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'subscribed_at'>('subscribed_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscribers:', error);
        setSubscribers([]);
      } else {
        setSubscribers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSubscribers([]);
    }
    setLoading(false);
  };

  const handleSort = (field: 'subscribed_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedSubscribers = useMemo(() => {
    let filtered = subscribers.filter(sub => {
      if (filter === 'active') return sub.active;
      if (filter === 'inactive') return !sub.active;
      return true;
    });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.subscribed_at).getTime();
      const bDate = new Date(b.subscribed_at).getTime();
      
      if (sortDirection === 'asc') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    });
  }, [subscribers, filter, sortField, sortDirection]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscriber:', error);
      alert('Failed to delete subscriber');
    }

    fetchSubscribers();
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Subscribed At', 'Source', 'Status'].join(','),
      ...filteredAndSortedSubscribers.map(sub => [
        sub.email,
        new Date(sub.subscribed_at).toLocaleDateString(),
        sub.source,
        sub.active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-gray-600">Loading subscribers...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Newsletter Subscribers</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {subscribers.length} subscribers
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All ({subscribers.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'active' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Active ({subscribers.filter(s => s.active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'inactive' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Inactive ({subscribers.filter(s => !s.active).length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('subscribed_at')}
              >
                <div className="flex items-center gap-2">
                  Subscribed At
                  <span className="text-xs">
                    {sortField === 'subscribed_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredAndSortedSubscribers.map((subscriber) => (
              <tr key={subscriber.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{subscriber.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {subscriber.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(subscriber.subscribed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-3 text-sm">
                  {subscriber.active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">✓ Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">✗ Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleDelete(subscriber.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSortedSubscribers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No subscribers found.
          </div>
        )}
      </div>
    </div>
  );
}
/* --------------------------- Authors Manager --------------------------- */

function AuthorsManager() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    favorite_event_type: '',
    avatar_url: '',
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', bio: '', favorite_event_type: '', avatar_url: '' });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (a: Author) => {
    setEditing(a);
    setFormData({
      name: a.name || '',
      slug: a.slug || '',
      bio: a.bio || '',
      favorite_event_type: a.favorite_event_type || '',
      avatar_url: a.avatar_url || '',
    });
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
    resetForm();
  };

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/authors', { method: 'GET' });
      const json = await res.json().catch(() => ([]));
      setAuthors(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error('Error fetching authors:', e);
      setAuthors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleNameChange = (name: string) => {
    const nextSlug = slugify(name);
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug ? prev.slug : nextSlug,
    }));
  };

  const saveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        bio: formData.bio.trim() || null,
        favorite_event_type: formData.favorite_event_type.trim() || null,
        avatar_url: formData.avatar_url.trim() || null,
      };

      if (!payload.name) {
        alert('Name is required.');
        setSaving(false);
        return;
      }

      if (!payload.slug) {
        alert('Slug is required.');
        setSaving(false);
        return;
      }

      const url = editing ? `/api/admin/authors/${editing.id}` : '/api/admin/authors';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to save author.');
        setSaving(false);
        return;
      }

      await fetchAuthors();
      close();
    } catch (e) {
      console.error('Save author error:', e);
      alert('Failed to save author.');
    }

    setSaving(false);
  };

  const deleteAuthor = async (a: Author) => {
    if (!confirm(`Delete author "${a.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/authors/${a.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to delete author.');
        return;
      }
      await fetchAuthors();
    } catch (e) {
      console.error('Delete author error:', e);
      alert('Failed to delete author.');
    }
  };

  if (loading) return <div className="text-gray-600">Loading authors...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Authors</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage story authors.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchAuthors}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            + Add Author
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveAuthor} className="mb-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            {editing ? 'Edit Author' : 'Add New Author'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Favorite Event Type</label>
              <input
                type="text"
                value={formData.favorite_event_type}
                onChange={(e) => setFormData((p) => ({ ...p, favorite_event_type: e.target.value }))}
                placeholder="Live Music"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Avatar URL</label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Update Author' : 'Create Author'}
            </button>
            <button
              type="button"
              onClick={close}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Favorite</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {authors.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.favorite_event_type || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800 mr-3">
                      Edit
                    </button>
                    <button onClick={() => deleteAuthor(a)} className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {authors.length === 0 && (
            <div className="text-center py-8 text-gray-500">No authors yet. Add one above.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------ Submissions Manager ------------------------ */

function SubmissionsManager() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [viewingSubmission, setViewingSubmission] = useState<any>(null);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [sortField, setSortField] = useState<'submitted_at'>('submitted_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]);
      } else {
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
    setLoading(false);
  };

  const handleSort = (field: 'submitted_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions.filter(sub => {
      if (filter === 'all') return true;
      return sub.status === filter;
    });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.submitted_at).getTime();
      const bDate = new Date(b.submitted_at).getTime();
      
      if (sortDirection === 'asc') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    });
  }, [submissions, filter, sortField, sortDirection]);

  const handleApprove = async (submission: any) => {
    if (!confirm('Approve this event and publish it to the site?')) return;

    try {
      if (submission.status === 'approved' && submission.approved_event_id) {
        alert('This submission has already been approved.');
        return;
      }

      const { data: insertedEvent, error: eventError } = await supabase
        .from('events')
        .insert([{
          title: submission.title,
          event_date: submission.event_date,
          time: submission.time,
          location: submission.location,
          event_type: submission.event_type,
          subtype_1: submission.subtype_1,
          subtype_2: submission.subtype_2,
          subtype_3: submission.subtype_3,
          neighborhood: submission.neighborhood,
          pricing_type: submission.pricing_type,
          description: submission.description,
          image_url: submission.image_url,
          price: submission.price,
          instagram_url: submission.instagram_url,
          insider_tip: submission.insider_tip,
          vibe: [],
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: updateError } = await supabase
        .from('event_submissions')
        .update({
          status: 'approved',
          approved_event_id: insertedEvent.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      alert('Event approved and published!');
      fetchSubmissions();
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Failed to approve event');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this event submission?')) return;

    try {
      const { error } = await supabase
        .from('event_submissions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      alert('Event rejected');
      fetchSubmissions();
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Failed to reject event');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this submission?')) return;

    try {
      const { error } = await supabase
        .from('event_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchSubmissions();
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading submissions...</div>;
  }

  if (editingSubmission) {
    return <SubmissionEditForm submission={editingSubmission} onClose={() => { setEditingSubmission(null); fetchSubmissions(); }} onApprove={handleApprove} />;
  }

  if (viewingSubmission) {
    return (
      <div>
        <button
          onClick={() => setViewingSubmission(null)}
          className="mb-6 text-purple-600 hover:text-purple-800 font-semibold"
        >
          ← Back to Submissions
        </button>

        <div className="bg-white rounded-lg shadow-lg border p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{viewingSubmission.title}</h2>
              <p className="text-gray-600 mt-1">
                Submitted by {viewingSubmission.organizer_name} on{' '}
                {new Date(viewingSubmission.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              viewingSubmission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              viewingSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {viewingSubmission.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Event Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(viewingSubmission.event_date).toLocaleDateString()}</p>
                {viewingSubmission.time && <p><strong>Time:</strong> {viewingSubmission.time}</p>}
                <p><strong>Location:</strong> {viewingSubmission.location}</p>
                {viewingSubmission.neighborhood && <p><strong>Neighborhood:</strong> {viewingSubmission.neighborhood}</p>}
                <p><strong>Type:</strong> {viewingSubmission.event_type}</p>
                {viewingSubmission.subtype_1 && <p><strong>Category 2:</strong> {viewingSubmission.subtype_1}</p>}
                {viewingSubmission.subtype_2 && <p><strong>Category 3:</strong> {viewingSubmission.subtype_2}</p>}
                <p><strong>Pricing:</strong> {viewingSubmission.pricing_type}</p>
                {viewingSubmission.price && <p><strong>Price Details:</strong> {viewingSubmission.price}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Organizer Contact</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {viewingSubmission.organizer_name}</p>
                <p><strong>Email:</strong> <a href={`mailto:${viewingSubmission.organizer_email}`} className="text-purple-600 hover:underline">{viewingSubmission.organizer_email}</a></p>
                {viewingSubmission.organizer_phone && <p><strong>Phone:</strong> {viewingSubmission.organizer_phone}</p>}
                {viewingSubmission.organizer_instagram && <p><strong>Instagram:</strong> {viewingSubmission.organizer_instagram}</p>}
              </div>
            </div>
          </div>

          {viewingSubmission.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600">{viewingSubmission.description}</p>
            </div>
          )}

          {viewingSubmission.image_url && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Event Image</h3>
              <img src={viewingSubmission.image_url} alt={viewingSubmission.title} className="max-w-md rounded-lg" />
            </div>
          )}

          {viewingSubmission.instagram_url && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Instagram Post</h3>
              <a href={viewingSubmission.instagram_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                {viewingSubmission.instagram_url}
              </a>
            </div>
          )}

          {viewingSubmission.insider_tip && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Insider Tip</h3>
              <p className="text-gray-600">{viewingSubmission.insider_tip}</p>
            </div>
          )}

          {viewingSubmission.status === 'pending' && (
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={() => setEditingSubmission(viewingSubmission)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                ✏️ Edit & Approve
              </button>
              <button
                onClick={() => handleApprove(viewingSubmission)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                ✓ Approve As-Is
              </button>
              <button
                onClick={() => handleReject(viewingSubmission.id)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                ✗ Reject
              </button>
              <button
                onClick={() => handleDelete(viewingSubmission.id)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Delete
              </button>
            </div>
          )}

          {viewingSubmission.status !== 'pending' && (
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={() => handleDelete(viewingSubmission.id)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Delete Submission
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Event Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve event submissions from organizers
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'pending' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Pending ({submissions.filter(s => s.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'approved' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Approved ({submissions.filter(s => s.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'rejected' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Rejected ({submissions.filter(s => s.status === 'rejected').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All ({submissions.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Event</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Organizer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('submitted_at')}
              >
                <div className="flex items-center gap-2">
                  Submitted
                  <span className="text-xs">
                    {sortField === 'submitted_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredAndSortedSubmissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">{submission.title}</div>
                  <div className="text-xs text-gray-600">{submission.location}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{submission.organizer_name}</div>
                  <div className="text-xs text-gray-600">{submission.organizer_email}</div>
                </td>
                <td className="px-4 py-3 text-sm">{new Date(submission.event_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm">{new Date(submission.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {submission.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => setViewingSubmission(submission)}
                    className="text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSortedSubmissions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {filter !== 'all' ? filter : ''} submissions found.
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionEditForm({ submission, onClose, onApprove }: { submission: any; onClose: () => void; onApprove: (submission: any) => void }) {
  const [formData, setFormData] = useState({
    title: submission.title,
    event_date: submission.event_date,
    time: submission.time || '',
    location: submission.location,
    event_type: submission.event_type,
    subtype_1: submission.subtype_1 || '',
    subtype_2: submission.subtype_2 || '',
    subtype_3: submission.subtype_3 || '',
    neighborhood: submission.neighborhood || '',
    pricing_type: submission.pricing_type,
    description: submission.description || '',
    image_url: submission.image_url || '',
    price: submission.price || '',
    instagram_url: submission.instagram_url || '',
    insider_tip: submission.insider_tip || ''
  });

  const eventTypes = [
    'Music', 'Food & Drink', 'Art & Culture', 'Nightlife', 'Sports & Fitness',
    'Market', 'Community', 'Comedy', 'Festival', 'Film & Theater', 'Wellness',
    'Political & Activism', 'Networking & Social', 'Coffee & Tea',
    'Education & Workshops', 'Outdoors & Nature',
  ];

  const neighborhoods = [
    'Downtown', 'East Austin', 'South Austin', 'North Austin', 'West Austin',
    'Central', 'Rainey Street', '6th Street', 'Domain', 'Mueller', 'Zilker', 'Other'
  ];

  const pricingTypes = ['Free', 'Free with RSVP', 'Ticketed'];

  const handleApproveEdited = () => {
    const editedSubmission = { ...submission, ...formData };
    onApprove(editedSubmission);
  };

  return (
    <div>
      <button
        onClick={onClose}
        className="mb-6 text-purple-600 hover:text-purple-800 font-semibold"
      >
        ← Back to Submission
      </button>

      <div className="bg-white rounded-lg shadow-lg border p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit & Approve Submission</h2>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Submitted by:</strong> {submission.organizer_name} ({submission.organizer_email})
          </p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Event Type *</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Neighborhood</label>
              <select
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select neighborhood</option>
                {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Date *</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Pricing Type *</label>
              <select
                value={formData.pricing_type}
                onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {pricingTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Price Details</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Instagram URL</label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Insider Tip</label>
              <input
                type="text"
                value={formData.insider_tip}
                onChange={(e) => setFormData({ ...formData, insider_tip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleApproveEdited}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              ✓ Approve & Publish
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/* ------------------------ Organizer Inquiries ------------------------ */

type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'booked' | 'closed';

const INQUIRY_STATUS_OPTIONS: Array<{ value: InquiryStatus; label: string; badge: string }> = [
  { value: 'new', label: 'New', badge: 'NEW' },
  { value: 'contacted', label: 'Contacted', badge: 'CONTACTED' },
  { value: 'in_progress', label: 'In Progress', badge: 'IN PROGRESS' },
  { value: 'booked', label: 'Booked', badge: 'BOOKED' },
  { value: 'closed', label: 'Closed', badge: 'CLOSED' },
];

function statusPillClasses(status: InquiryStatus) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'contacted':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'booked':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'closed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function OrganizerInquiriesManager() {
  const [inquiries, setInquiries] = useState<OrganizerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OrganizerInquiry | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [sortField, setSortField] = useState<'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchInquiries = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/organizer-inquiries', { method: 'GET' });

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMsg('Not authenticated. Please log in again.');
        } else {
          const text = await res.text();
          setErrorMsg(`Failed to load inquiries (${res.status}). ${text || ''}`.trim());
        }
        setInquiries([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setInquiries(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to load inquiries.');
      setInquiries([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSort = (field: 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedInquiries = useMemo(() => {
    return [...inquiries].sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [inquiries, sortField, sortDirection]);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      alert('Copied!');
    } catch {
      alert('Could not copy. Try selecting and copying manually.');
    }
  };

  const updateInquiryStatus = async (inquiryIdRaw: string, nextStatus: InquiryStatus) => {
    const inquiryId = String(inquiryIdRaw || '').trim();

    if (!inquiryId || inquiryId === 'undefined' || !isUuid(inquiryId)) {
      alert('Invalid inquiry id. Refresh and try again.');
      return;
    }

    setSavingId(inquiryId);

    // optimistic UI
    setInquiries((prev) =>
      prev.map((i) => (String(i.id) === inquiryId ? { ...i, status: nextStatus } : i))
    );
    setViewing((prev) =>
      prev && String(prev.id) === inquiryId ? { ...prev, status: nextStatus } : prev
    );

    try {
      const res = await fetch(`/api/admin/organizer-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        await fetchInquiries();
        alert(json?.error || `Failed to update status (${res.status})`);
        return;
      }

      // Your PATCH route returns the updated row directly (not { inquiry: ... })
      const updated = json;

      if (updated && updated.id) {
        setInquiries((prev) =>
          prev.map((i) => (String(i.id) === inquiryId ? { ...i, ...updated } : i))
        );
        setViewing((prev) =>
          prev && String(prev.id) === inquiryId ? { ...prev, ...updated } : prev
        );
      }
    } catch (e) {
      await fetchInquiries();
      alert('Failed to update status. Check the console/server logs.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="text-gray-600">Loading organizer inquiries...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Organizer Inquiries</h2>
          <p className="text-sm text-gray-600 mt-1">Total: {inquiries.length}</p>
        </div>
        <button
          onClick={fetchInquiries}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {errorMsg}
        </div>
      )}

      {viewing && (
        <div className="mb-6 bg-white rounded-lg shadow-lg border p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{viewing.name || 'Organizer'}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Submitted: {formatDateTimeMaybe(viewing.created_at)}
              </p>
            </div>
            <button
              onClick={() => setViewing(null)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>

          {/* Status control */}
          <div className="mt-6 flex items-center gap-3">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-lg border text-sm font-semibold ${
                statusPillClasses((viewing.status || 'new') as InquiryStatus)
              }`}
            >
              {INQUIRY_STATUS_OPTIONS.find(
                (s) => s.value === ((viewing.status || 'new') as InquiryStatus)
              )?.badge || 'NEW'}
            </div>

            <div className="min-w-[220px]">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Status</label>
              <select
                value={(viewing.status || 'new') as InquiryStatus}
                onChange={(e) =>
                  updateInquiryStatus(String(viewing.id), e.target.value as InquiryStatus)
                }
                disabled={savingId === String(viewing.id)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {INQUIRY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {savingId === String(viewing.id) && (
                <div className="text-xs text-gray-500 mt-2">Saving…</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Contact</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <strong>Email:</strong>{' '}
                  {viewing.email ? (
                    <>
                      <a className="text-purple-600 hover:underline" href={`mailto:${viewing.email}`}>
                        {viewing.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(viewing.email!)}
                        className="ml-2 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Copy
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>

                <div>
                  <strong>Phone:</strong>{' '}
                  {viewing.phone ? viewing.phone : <span className="text-gray-500">None</span>}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Event</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <strong>Event Name:</strong>{' '}
                  {viewing.event_name ? viewing.event_name : <span className="text-gray-500">None</span>}
                </div>
                <div>
                  <strong>Event Date:</strong>{' '}
                  {viewing.event_date ? new Date(viewing.event_date).toLocaleDateString() : <span className="text-gray-500">None</span>}
                </div>
                <div>
                  <strong>Package Interest:</strong>{' '}
                  {viewing.package_interest ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      {viewing.package_interest}
                    </span>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-2">Event Description</h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 border rounded-lg p-4">
              {viewing.event_description || 'No event description provided.'}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-2">Goals and Questions</h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 border rounded-lg p-4">
              {viewing.goals_and_questions || 'No goals or questions provided.'}
            </div>
          </div>

          <div className="mt-6">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">View raw record</summary>
              <pre className="mt-3 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs">
{JSON.stringify(viewing, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Organizer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Package</th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Submitted
                  <span className="text-xs">
                    {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {sortedInquiries.map((inq) => {
              const id = String(inq.id);
              const name = inq.name || 'Organizer';
              const email = inq.email || '';
              const submitted = formatDateTimeMaybe(inq.created_at);

              const currentStatus = ((inq.status || 'new') as InquiryStatus);

              return (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    <div>{name}</div>
                    {inq.event_name && <div className="text-xs text-gray-600">{inq.event_name}</div>}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {email ? (
                      <a className="text-purple-600 hover:underline" href={`mailto:${email}`}>
                        {email}
                      </a>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-semibold ${statusPillClasses(
                          currentStatus
                        )}`}
                      >
                        {INQUIRY_STATUS_OPTIONS.find((s) => s.value === currentStatus)?.badge || 'NEW'}
                      </span>

                      <select
                        value={currentStatus}
                        onChange={(e) => updateInquiryStatus(id, e.target.value as InquiryStatus)}
                        disabled={savingId === id}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        title="Update status"
                      >
                        {INQUIRY_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {inq.package_interest ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {inq.package_interest}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {submitted || <span className="text-gray-500">Unknown</span>}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setViewing(inq)}
                      className="text-purple-600 hover:text-purple-800 font-semibold"
                    >
                      View
                    </button>
                    {email && (
                      <button
                        onClick={() => copyToClipboard(email)}
                        className="ml-3 text-gray-600 hover:text-gray-800"
                      >
                        Copy Email
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {inquiries.length === 0 && (
          <div className="text-center py-8 text-gray-500">No organizer inquiries yet.</div>
        )}
      </div>
    </div>
  );
}
