'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'not_a_fit';

const STATUS_OPTIONS: Array<{ value: InquiryStatus; label: string; badge: string }> = [
  { value: 'new', label: 'New', badge: 'NEW' },
  { value: 'contacted', label: 'Contacted', badge: 'CONTACTED' },
  { value: 'in_progress', label: 'In Progress', badge: 'IN PROGRESS' },
  { value: 'closed', label: 'Closed', badge: 'CLOSED' },
  { value: 'not_a_fit', label: 'Not a fit', badge: 'NOT A FIT' },
];

type OrganizerInquiryRow = {
  id: number;
  created_at: string | null;

  // these may vary by your schema; we’ll handle unknowns gracefully
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  organization_name?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  message?: string | null;

  inquiry_status?: InquiryStatus | null;

  // optional extras some schemas have
  city?: string | null;
  budget?: string | null;
  notes?: string | null;
};

function formatDateTime(dt: string | null) {
  if (!dt) return '—';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleString();
}

function pillClasses(status: InquiryStatus) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'contacted':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'closed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'not_a_fit':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function toCsvValue(v: unknown) {
  const s = String(v ?? '');
  // escape quotes
  const escaped = s.replaceAll('"', '""');
  // wrap if contains comma/newline/quote
  if (/[,"\n]/.test(escaped)) return `"${escaped}"`;
  return escaped;
}

export default function OrganizerInquiriesManager() {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrganizerInquiryRow[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');

  const [sortBy, setSortBy] = useState<'created_at' | 'inquiry_status'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc'); // newest first default

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizer_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows((data as OrganizerInquiryRow[]) ?? []);
    } catch (e) {
      console.error('Fetch organizer inquiries error:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const out = rows.filter((r) => {
      if (statusFilter !== 'all') {
        const st = (r.inquiry_status ?? 'new') as InquiryStatus;
        if (st !== statusFilter) return false;
      }

      if (!q) return true;

      const hay = [
        r.name,
        r.email,
        r.phone,
        r.organization_name,
        r.website_url,
        r.instagram_url,
        r.message,
        r.notes,
        r.city,
        r.budget,
        r.inquiry_status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });

    // sort
    return out.sort((a, b) => {
      if (sortBy === 'created_at') {
        const ta = new Date(a.created_at ?? 0).getTime();
        const tb = new Date(b.created_at ?? 0).getTime();
        return sortDir === 'asc' ? ta - tb : tb - ta;
      }

      // sortBy inquiry_status (simple label compare)
      const sa = (a.inquiry_status ?? 'new') as InquiryStatus;
      const sb = (b.inquiry_status ?? 'new') as InquiryStatus;
      const la = STATUS_OPTIONS.find((x) => x.value === sa)?.label ?? sa;
      const lb = STATUS_OPTIONS.find((x) => x.value === sb)?.label ?? sb;

      if (la < lb) return sortDir === 'asc' ? -1 : 1;
      if (la > lb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, query, statusFilter, sortBy, sortDir]);

  const updateStatus = async (id: number, next: InquiryStatus) => {
    try {
      setUpdatingId(id);

      // try the most likely column names; your earlier code used inquiry_status
      const { error } = await supabase
        .from('organizer_inquiries')
        .update({ inquiry_status: next })
        .eq('id', id);

      if (error) throw error;

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, inquiry_status: next } : r)));
    } catch (e) {
      console.error('Update inquiry status error:', e);
      alert('Failed to update inquiry status. Check console for details.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteInquiry = async (id: number) => {
    if (!confirm('Delete this organizer inquiry? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('organizer_inquiries').delete().eq('id', id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      console.error('Delete inquiry error:', e);
      alert('Failed to delete inquiry.');
    }
  };

  const exportCsv = () => {
    const cols = [
      'id',
      'created_at',
      'inquiry_status',
      'name',
      'email',
      'phone',
      'organization_name',
      'website_url',
      'instagram_url',
      'city',
      'budget',
      'message',
      'notes',
    ] as const;

    const header = cols.join(',');
    const lines = filtered.map((r) =>
      cols
        .map((c) => {
          const v = r[c];
          return toCsvValue(v ?? '');
        })
        .join(',')
    );

    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `organizer_inquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Organizer Inquiries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage organizer leads submitted through your &quot;For organizers&quot; form
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchRows}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Refresh
          </button>
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Search name, email, org, message..."
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InquiryStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="created_at">Sort by submitted</option>
              <option value="inquiry_status">Sort by status</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-semibold text-gray-700"
            >
              {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-3">
          Showing <span className="font-semibold">{filtered.length}</span> of{' '}
          <span className="font-semibold">{rows.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Submitted
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Lead</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Organization
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map((r) => {
              const status = (r.inquiry_status ?? 'new') as InquiryStatus;
              const isExpanded = expandedId === r.id;

              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDateTime(r.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900">{r.name || '—'}</div>
                    <div className="text-xs text-gray-600">
                      {r.email ? (
                        <a className="hover:underline" href={`mailto:${r.email}`}>
                          {r.email}
                        </a>
                      ) : (
                        'No email'
                      )}
                      {r.phone ? <span className="text-gray-400"> · </span> : null}
                      {r.phone ? (
                        <a className="hover:underline" href={`tel:${r.phone}`}>
                          {r.phone}
                        </a>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 font-semibold">
                      {r.organization_name || '—'}
                    </div>
                    <div className="text-xs text-gray-600 flex gap-2 flex-wrap">
                      {r.website_url ? (
                        <a
                          className="hover:underline"
                          href={r.website_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Website
                        </a>
                      ) : null}
                      {r.instagram_url ? (
                        <a
                          className="hover:underline"
                          href={r.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Instagram
                        </a>
                      ) : null}
                      {r.city ? <span className="text-gray-500">{r.city}</span> : null}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 border rounded-full text-xs font-bold ${pillClasses(
                        status
                      )}`}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === status)?.badge ?? status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setExpandedId((prev) => (prev === r.id ? null : r.id))}
                        className="px-3 py-2 text-sm font-semibold bg-white border rounded-lg hover:bg-gray-50"
                      >
                        {isExpanded ? 'Hide' : 'View'}
                      </button>

                      <select
                        value={status}
                        onChange={(e) => updateStatus(r.id, e.target.value as InquiryStatus)}
                        disabled={updatingId === r.id}
                        className="px-3 py-2 text-sm border rounded-lg bg-white"
                        title="Update status"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => deleteInquiry(r.id)}
                        className="px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 text-sm text-gray-700 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <div className="text-xs font-bold text-gray-600 mb-1">Message</div>
                            <div className="whitespace-pre-wrap">{r.message || '—'}</div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Extra details
                            </div>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-gray-500">Budget:</span>{' '}
                                <span className="font-semibold">{r.budget || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">City:</span>{' '}
                                <span className="font-semibold">{r.city || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Notes:</span>{' '}
                                <span className="font-semibold">{r.notes || '—'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500">No organizer inquiries found.</div>
        )}
      </div>
    </div>
  );
}
