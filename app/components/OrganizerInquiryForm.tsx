'use client';

import { useState } from 'react';

type PackageInterest = 'featured' | 'premium' | 'full_production' | 'monthly' | 'not_sure';

type FormState = {
  name: string;
  email: string;
  phone: string;
  event_name: string;
  event_date: string; // YYYY-MM-DD
  event_description: string;
  package_interest: PackageInterest;
  goals_and_questions: string;
};

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  event_name: '',
  event_date: '',
  event_description: '',
  package_interest: 'not_sure',
  goals_and_questions: '',
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function OrganizerInquiryForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Please enter your name.');
    if (!form.email.trim() || !isValidEmail(form.email)) return setError('Please enter a valid email address.');
    if (!form.package_interest) return setError('Please select what you’re interested in.');

const res = await fetch('/api/organizer-inquiry', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(form),
});

if (!res.ok) {
  setError('Something went wrong. Please try again.');
  return;
}

setSubmitted(true);

  };

  if (submitted) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-2">You’re in.</h3>
      <p className="text-gray-600">
        We just sent the Organizer Guide to <span className="font-medium text-gray-900">{form.email}</span>.
      </p>

      <div className="mt-4 rounded-md bg-gray-50 border p-4 text-sm text-gray-700">
        <p className="font-medium mb-1">If you don’t see it:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Check Spam or Promotions</li>
          <li>Search your inbox for “Organizer Guide”</li>
          <li>Wait 2 to 3 minutes and refresh</li>
        </ul>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        If it’s a good fit, we usually reply within 1 to 2 business days.
      </p>

      <button
        className="mt-5 px-4 py-2 rounded bg-black text-white text-sm"
        onClick={() => {
          setSubmitted(false);
          setForm(initialState);
        }}
      >
        Submit another
      </button>
    </div>
  );
}


  return (
    <form onSubmit={onSubmit} className="rounded-lg border p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Get the Organizer Guide</h3>
        <p className="text-sm text-gray-600">
          Share a few details and we’ll send the full offerings + pricing guide.
        </p>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.name}
            onChange={onChange('name')}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.email}
            onChange={onChange('email')}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.phone}
            onChange={onChange('phone')}
            placeholder="(512) 555-5555"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Interest *</label>
          <select
            className="w-full rounded border px-3 py-2 bg-white"
            value={form.package_interest}
            onChange={onChange('package_interest')}
          >
            <option value="not_sure">Not sure yet</option>
            <option value="featured">Featured listing</option>
            <option value="premium">Promo pack</option>
            <option value="full_production">Event coverage / mini doc</option>
            <option value="monthly">Monthly partner</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Event name (optional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.event_name}
            onChange={onChange('event_name')}
            placeholder="e.g., Market Night at..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Event date (optional)</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={form.event_date}
            onChange={onChange('event_date')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Event description (optional)</label>
        <textarea
          className="w-full rounded border px-3 py-2 min-h-[90px]"
          value={form.event_description}
          onChange={onChange('event_description')}
          placeholder="What is it, where is it, what’s the vibe?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Goals / questions (optional)</label>
        <textarea
          className="w-full rounded border px-3 py-2 min-h-[90px]"
          value={form.goals_and_questions}
          onChange={onChange('goals_and_questions')}
          placeholder="What are you trying to achieve? Any questions for us?"
        />
      </div>

      <button
        type="submit"
        className="px-5 py-3 rounded bg-black text-white text-sm font-medium"
      >
        Get the Organizer Guide
      </button>

      <p className="text-xs text-gray-500">
        We’ll never spam. This helps us understand fit and send the right info.
      </p>
    </form>
  );
}
