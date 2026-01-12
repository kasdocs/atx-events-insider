'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';

export default function SubmitEvent() {
  const [formData, setFormData] = useState({
    // honeypot (bots fill this, humans never see it)
    website: '',

    title: '',
    event_date: '',
    time: '',
    location: '',
    event_type: 'Music',
    subtype_1: '',
    subtype_2: '',
    subtype_3: '',
    neighborhood: '',
    pricing_type: 'Free',
    description: '',
    image_url: '',
    price: '',
    instagram_url: '',
    insider_tip: '',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    organizer_instagram: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit event');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#7B2CBF' }}>
              🎉 Event Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              Thanks for submitting your event! We will review it and get back to you within 24-48 hours.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    website: '',

                    title: '',
                    event_date: '',
                    time: '',
                    location: '',
                    event_type: 'Music',
                    subtype_1: '',
                    subtype_2: '',
                    subtype_3: '',
                    neighborhood: '',
                    pricing_type: 'Free',
                    description: '',
                    image_url: '',
                    price: '',
                    instagram_url: '',
                    insider_tip: '',
                    organizer_name: '',
                    organizer_email: '',
                    organizer_phone: '',
                    organizer_instagram: '',
                  });
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Submit Another Event
              </button>

              <a
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-gradient-to-b from-purple-50 to-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-center" style={{ color: '#7B2CBF' }}>
            Submit Your Event
          </h1>
          <p className="text-lg text-gray-600 text-center mb-8">
            Get your Austin event featured on ATX Events Insider! Fill out the form below and we will review your submission.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border p-8">
          {/* Honeypot field: hidden from humans, visible to many bots */}
          <div className="hidden" aria-hidden="true">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Website
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>

          <h2 className="text-2xl font-bold mb-6" style={{ color: '#FF006E' }}>Event Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., East Austin Art Walk"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Event Date *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., The Saxon Pub, 1320 S Lamar Blvd"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Neighborhood</label>
              <select
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select neighborhood</option>
                {neighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Event Type *</label>
              <select
                required
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Additional Category 1</label>
              <select
                value={formData.subtype_1}
                onChange={(e) => setFormData({ ...formData, subtype_1: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">None</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Additional Category 2</label>
              <select
                value={formData.subtype_2}
                onChange={(e) => setFormData({ ...formData, subtype_2: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">None</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Pricing Type *</label>
              <select
                required
                value={formData.pricing_type}
                onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Tell us about your event..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Event Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/event-image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">Provide a link to a high-quality image for your event</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Instagram Post URL</label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/p/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">Link to your Instagram post about this event</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Insider Tip</label>
              <input
                type="text"
                value={formData.insider_tip}
                onChange={(e) => setFormData({ ...formData, insider_tip: e.target.value })}
                placeholder="Share a tip for attendees (e.g., Best burgers in town)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 mt-8" style={{ color: '#FF006E' }}>
            Your Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Your Name *</label>
              <input
                type="text"
                required
                value={formData.organizer_name}
                onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.organizer_email}
                onChange={(e) => setFormData({ ...formData, organizer_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={formData.organizer_phone}
                onChange={(e) => setFormData({ ...formData, organizer_phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="(512) 555-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Instagram Handle</label>
              <input
                type="text"
                value={formData.organizer_instagram}
                onChange={(e) => setFormData({ ...formData, organizer_instagram: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="@yourbusiness"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Event for Review'}
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            By submitting, you agree to our terms and confirm that you have the rights to share this event information.
          </p>
        </form>
      </div>
    </div>
  );
}
