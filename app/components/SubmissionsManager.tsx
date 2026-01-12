'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const makeSlug = (title: string, eventDate: string) => {
  return `${title}-${eventDate}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
};

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

type Submission = {
  id: number;
  title: string;
  event_date: string;
  time?: string | null;
  location: string;
  event_type: string;
  subtype_1?: string | null;
  subtype_2?: string | null;
  subtype_3?: string | null;
  neighborhood?: string | null;
  pricing_type: string;
  description?: string | null;
  image_url?: string | null;
  price?: string | null;
  instagram_url?: string | null;
  insider_tip?: string | null;
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string | null;
  organizer_instagram?: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  approved_event_id: number | null;
  approved_at: string | null;
};

export default function SubmissionsManager() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('pending');
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setSubmissions(Array.isArray(data) ? (data as Submission[]) : []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
    setLoading(false);
  };

  const handleApprove = async (submission: Submission) => {
    if (!confirm('Approve this event and publish it to the site?')) return;

    // Prevent double-approve
    if (submission.status === 'approved' || submission.approved_event_id) {
      alert('This submission is already approved.');
      return;
    }

    try {
      const slug = makeSlug(submission.title, submission.event_date);

      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            title: submission.title,
            event_date: submission.event_date,
            time: submission.time ?? null,
            location: submission.location,
            event_type: submission.event_type,
            subtype_1: submission.subtype_1 ?? null,
            subtype_2: submission.subtype_2 ?? null,
            subtype_3: submission.subtype_3 ?? null,
            neighborhood: submission.neighborhood ?? null,
            pricing_type: submission.pricing_type,
            description: submission.description ?? null,
            image_url: submission.image_url ?? null,
            price: submission.price ?? null,
            instagram_url: submission.instagram_url ?? null,
            insider_tip: submission.insider_tip ?? null,
            vibe: [],
            slug,
          },
        ])
        .select('id')
        .single();

      if (eventError) throw eventError;

      const createdId = createdEvent?.id;
      if (!createdId) {
        throw new Error('Event created but no ID was returned from Supabase.');
      }

      const { error: updateError } = await supabase
        .from('event_submissions')
        .update({
          status: 'approved',
          approved_event_id: createdId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      alert('Event approved and published!');
      await fetchSubmissions();
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error approving submission:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve event');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this event submission?')) return;

    try {
      const res = await fetch('/api/admin/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to reject submission.');

      alert('Event rejected');
      await fetchSubmissions();
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject event');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this submission?')) return;

    try {
      const res = await fetch('/api/admin/submissions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to delete submission.');

      await fetchSubmissions();
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete submission');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  if (loading) {
    return <div className="text-gray-600">Loading submissions...</div>;
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
          <div className="flex justify-between items-start mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{viewingSubmission.title}</h2>
              <p className="text-gray-600 mt-1">
                Submitted by {viewingSubmission.organizer_name} on{' '}
                {new Date(viewingSubmission.submitted_at).toLocaleDateString()}
              </p>

              {viewingSubmission.status === 'approved' && viewingSubmission.approved_event_id && (
                <a
                  href={`/events/${viewingSubmission.approved_event_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-purple-600 hover:text-purple-800"
                >
                  View published event →
                </a>
              )}
            </div>

            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                viewingSubmission.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : viewingSubmission.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {viewingSubmission.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Event Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Date:</strong> {new Date(viewingSubmission.event_date).toLocaleDateString()}
                </p>
                {viewingSubmission.time && (
                  <p>
                    <strong>Time:</strong> {viewingSubmission.time}
                  </p>
                )}
                <p>
                  <strong>Location:</strong> {viewingSubmission.location}
                </p>
                {viewingSubmission.neighborhood && (
                  <p>
                    <strong>Neighborhood:</strong> {viewingSubmission.neighborhood}
                  </p>
                )}
                <p>
                  <strong>Type:</strong> {viewingSubmission.event_type}
                </p>
                {viewingSubmission.subtype_1 && (
                  <p>
                    <strong>Category 2:</strong> {viewingSubmission.subtype_1}
                  </p>
                )}
                {viewingSubmission.subtype_2 && (
                  <p>
                    <strong>Category 3:</strong> {viewingSubmission.subtype_2}
                  </p>
                )}
                <p>
                  <strong>Pricing:</strong> {viewingSubmission.pricing_type}
                </p>
                {viewingSubmission.price && (
                  <p>
                    <strong>Price Details:</strong> {viewingSubmission.price}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Organizer Contact</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Name:</strong> {viewingSubmission.organizer_name}
                </p>
                <p>
                  <strong>Email:</strong>{' '}
                  <a
                    href={`mailto:${viewingSubmission.organizer_email}`}
                    className="text-purple-600 hover:underline"
                  >
                    {viewingSubmission.organizer_email}
                  </a>
                </p>
                {viewingSubmission.organizer_phone && (
                  <p>
                    <strong>Phone:</strong> {viewingSubmission.organizer_phone}
                  </p>
                )}
                {viewingSubmission.organizer_instagram && (
                  <p>
                    <strong>Instagram:</strong> {viewingSubmission.organizer_instagram}
                  </p>
                )}
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
              <img
                src={viewingSubmission.image_url}
                alt={viewingSubmission.title}
                className="max-w-md rounded-lg"
              />
            </div>
          )}

          {viewingSubmission.instagram_url && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Instagram Post</h3>
              <a
                href={viewingSubmission.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
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

          {viewingSubmission.status === 'pending' ? (
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={() => handleApprove(viewingSubmission)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                ✓ Approve & Publish
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
          ) : (
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
          <p className="text-sm text-gray-600 mt-1">Review and approve event submissions from organizers</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === 'pending' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Pending ({submissions.filter((s) => s.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === 'approved' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Approved ({submissions.filter((s) => s.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === 'rejected' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Rejected ({submissions.filter((s) => s.status === 'rejected').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
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
                <td className="px-4 py-3 text-sm">
                  {new Date(submission.event_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : submission.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
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
