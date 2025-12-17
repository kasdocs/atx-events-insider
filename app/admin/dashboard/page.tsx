'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

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
  vibe?: VibeValue[]; // NEW
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
  author: string;
  published_date: string;
  event_id?: number;
  featured: boolean;
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

function formatVibeLabel(value: string) {
  return value.replaceAll('_', ' ');
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
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-4 font-semibold ${activeTab === 'events' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Events
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
          </div>
          <div className="p-6">
            {activeTab === 'events' && <EventsManager />}
            {activeTab === 'stories' && <StoriesManager />}
            {activeTab === 'subscribers' && <SubscribersManager />}
            {activeTab === 'submissions' && <SubmissionsManager />}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vibe</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pricing</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => {
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
    vibe: (event?.vibe || []) as VibeValue[], // NEW
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

    // Auto-generate slug from title and date
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

        {/* NEW: Vibe checklist */}
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

/* --------------------------- Stories Manager --------------------------- */

function StoriesManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  useEffect(() => {
    fetchStories();
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
        <StoryForm
          story={editingStory}
          onClose={handleFormClose}
        />
      )}

      {!showForm && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Published Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Featured</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{story.title}</td>
                  <td className="px-4 py-3 text-sm">{story.author}</td>
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

function StoryForm({ story, onClose }: { story: Story | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: story?.title || '',
    slug: story?.slug || '',
    excerpt: story?.excerpt || '',
    content: story?.content || '',
    author: story?.author || 'Kas',
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
          <input
            type="text"
            required
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
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

/* ------------------------ Subscribers + Submissions ------------------------ */
/* These are unchanged except for one small addition in Submissions approve insert: vibe: [] */

function SubscribersManager() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

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
    const filteredSubscribers = subscribers.filter(sub => {
      if (filter === 'active') return sub.active;
      if (filter === 'inactive') return !sub.active;
      return true;
    });

    const csv = [
      ['Email', 'Subscribed At', 'Source', 'Status'].join(','),
      ...filteredSubscribers.map(sub => [
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

  const filteredSubscribers = subscribers.filter(sub => {
    if (filter === 'active') return sub.active;
    if (filter === 'inactive') return !sub.active;
    return true;
  });

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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subscribed At</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSubscribers.map((subscriber) => (
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
        {filteredSubscribers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No subscribers found.
          </div>
        )}
      </div>
    </div>
  );
}

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

  const handleApprove = async (submission: any) => {
    if (!confirm('Approve this event and publish it to the site?')) return;

    try {
      const { error: eventError } = await supabase
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
          vibe: [], // NEW: submissions cannot set vibe, you assign later
        }]);

      if (eventError) throw eventError;

      const { error: updateError } = await supabase
        .from('event_submissions')
        .update({ status: 'approved' })
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

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSubmissions.map((submission) => (
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
        {filteredSubmissions.length === 0 && (
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
