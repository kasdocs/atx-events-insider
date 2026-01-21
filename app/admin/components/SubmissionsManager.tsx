'use client';

import { useEffect, useMemo, useState } from 'react';
import { toCsvValue, downloadTextFile } from '../lib/adminUtils';
import type { Database } from '@/lib/database.types';

type SubmissionRow = Database['public']['Tables']['event_submissions']['Row'];

type SubmissionStatus = 'new' | 'reviewing' | 'approved' | 'scheduled' | 'published' | 'rejected';

const STATUS_OPTIONS: Array<{ value: SubmissionStatus; label: string; badge: string }> = [
  { value: 'new', label: 'New', badge: 'NEW' },
  { value: 'reviewing', label: 'Reviewing', badge: 'REVIEWING' },
  { value: 'approved', label: 'Approved', badge: 'APPROVED' },
  { value: 'scheduled', label: 'Scheduled', badge: 'SCHEDULED' },
  { value: 'published', label: 'Published', badge: 'PUBLISHED' },
  { value: 'rejected', label: 'Rejected', badge: 'REJECTED' },
];

function statusPillClasses(status: SubmissionStatus) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'reviewing':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'approved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'scheduled':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'published':
      return 'bg-slate-900 text-white border-slate-900';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function formatIsoToLocal(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function safeString(v: unknown) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function SubmissionsManager() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SubmissionRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<SubmissionRow | null>(null);

  // inline notes editing
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // sorting
  type SortKey = 'created_at' | 'event_date' | 'title' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc'); // default newest first

  async function load() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/submissions', { cache: 'no-store' });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Request failed: ${res.status}`);

      const json = JSON.parse(text) as { items?: SubmissionRow[] };
      setItems(json.items ?? []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load submissions');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextKey);
    // sensible defaults
    if (nextKey === 'title') setSortDir('asc');
    else setSortDir('desc');
  }

  const filtered = useMemo(() => {
    const query = normalize(q);
    return items.filter((r) => {
      const status = (r as any).status as SubmissionStatus | null;
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!query) return true;

      const haystack = [
        (r as any).title,
        (r as any).event_title,
        (r as any).name,
        (r as any).submitter_name,
        (r as any).email,
        (r as any).submitter_email,
        (r as any).location,
        (r as any).neighborhood,
        (r as any).event_type,
        (r as any).description,
        (r as any).notes,
      ]
        .map(safeString)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, statusFilter, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aStatus = safeString((a as any).status);
      const bStatus = safeString((b as any).status);

      const aTitle = safeString((a as any).title || (a as any).event_title);
      const bTitle = safeString((b as any).title || (b as any).event_title);

      const aCreated = safeString((a as any).created_at);
      const bCreated = safeString((b as any).created_at);

      const aEventDate = safeString((a as any).event_date);
      const bEventDate = safeString((b as any).event_date);

      let cmp = 0;
      if (sortKey === 'created_at') cmp = aCreated.localeCompare(bCreated);
      if (sortKey === 'event_date') cmp = aEventDate.localeCompare(bEventDate);
      if (sortKey === 'title') cmp = aTitle.localeCompare(bTitle);
      if (sortKey === 'status') cmp = aStatus.localeCompare(bStatus);

      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  async function updateStatus(id: number, status: SubmissionStatus) {
    try {
      setErrorMsg(null);

      const res = await fetch('/api/admin/submissions/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);

      setItems((prev) =>
        prev.map((r) => ((r as any).id === id ? ({ ...(r as any), status } as SubmissionRow) : r))
      );

      setSelected((prev) =>
        prev && (prev as any).id === id ? ({ ...(prev as any), status } as SubmissionRow) : prev
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  async function saveNotes(id: number, notes: string) {
    try {
      setSavingNotes(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/submissions/update-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes }),
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);

      setItems((prev) =>
        prev.map((r) => ((r as any).id === id ? ({ ...(r as any), notes } as SubmissionRow) : r))
      );

      setSelected((prev) =>
        prev && (prev as any).id === id ? ({ ...(prev as any), notes } as SubmissionRow) : prev
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  }

  function openDetails(row: SubmissionRow) {
    setSelected(row);
    setNotesDraft(safeString((row as any).notes));
  }

  function exportCsv() {
    const cols = [
      'id',
      'created_at',
      'status',
      'title',
      'event_date',
      'time',
      'location',
      'neighborhood',
      'event_type',
      'pricing_type',
      'price',
      'instagram_url',
      'website_url',
      'image_url',
      'name',
      'email',
      'phone',
      'description',
      'notes',
    ] as const;

    const header = cols.join(',');

    const lines = sorted.map((r) =>
      cols
        .map((c) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = (r as any)[c];
          return toCsvValue(v ?? '');
        })
        .join(',')
    );

    const csv = [header, ...lines].join('\n');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`event-submissions-${stamp}.csv`, csv, 'text/csv;charset=utf-8;');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Event Submissions</div>
          <div className="text-sm text-gray-600">
            Review incoming organizer submissions and move them through your workflow.
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={exportCsv}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => void load()}
            className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-semibold text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="text-sm text-gray-600">
            {loading ? 'Loading…' : `${sorted.length} shown`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, name, email, location, notes…"
            className="w-full sm:w-96 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('created_at')} className="hover:underline">
                  Submitted {sortKey === 'created_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('status')} className="hover:underline">
                  Status {sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('title')} className="hover:underline">
                  Title {sortKey === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('event_date')} className="hover:underline">
                  Event date {sortKey === 'event_date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">Submitter</th>
              <th className="px-4 py-3 text-left font-bold">Location</th>
              <th className="px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                  Loading submissions…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                  No submissions match your filters.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const id = Number((r as any).id);
                const status = ((r as any).status as SubmissionStatus) ?? 'new';

                const title = safeString((r as any).title || (r as any).event_title || 'Untitled');
                const submittedAt = formatIsoToLocal((r as any).created_at ?? null);

                const eventDate = safeString((r as any).event_date || '');
                const time = safeString((r as any).time || '');
                const dateCell = eventDate ? `${eventDate}${time ? ` · ${time}` : ''}` : '—';

                const submitterName = safeString((r as any).name || (r as any).submitter_name || '');
                const submitterEmail = safeString((r as any).email || (r as any).submitter_email || '');

                const location = safeString((r as any).location || '');
                const neighborhood = safeString((r as any).neighborhood || '');
                const locCell = location ? `${location}${neighborhood ? ` · ${neighborhood}` : ''}` : neighborhood || '—';

                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{submittedAt}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusPillClasses(
                          status
                        )}`}
                      >
                        {STATUS_OPTIONS.find((o) => o.value === status)?.badge ?? status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{title}</div>
                      {safeString((r as any).event_type) && (
                        <div className="text-xs text-gray-600">{safeString((r as any).event_type)}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-800">{dateCell}</td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{submitterName || '—'}</div>
                      <div className="text-xs text-gray-600">{submitterEmail || ''}</div>
                    </td>

                    <td className="px-4 py-3 text-gray-800">{locCell}</td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <select
                          value={status}
                          onChange={(e) => void updateStatus(id, e.target.value as SubmissionStatus)}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => openDetails(r)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-gray-900">
                  {safeString((selected as any).title || (selected as any).event_title || 'Submission')}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Submitted {formatIsoToLocal((selected as any).created_at ?? null)}
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Submitter</div>
                  <div className="mt-2 text-sm">
                    <div className="font-semibold text-gray-900">
                      {safeString((selected as any).name || (selected as any).submitter_name || '—')}
                    </div>
                    <div className="text-gray-700">
                      {safeString((selected as any).email || (selected as any).submitter_email || '')}
                    </div>
                    <div className="text-gray-700">{safeString((selected as any).phone || '')}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Event basics</div>
                  <div className="mt-2 text-sm text-gray-800 space-y-1">
                    <div>
                      <span className="font-semibold">Date:</span>{' '}
                      {safeString((selected as any).event_date || '—')}
                    </div>
                    <div>
                      <span className="font-semibold">Time:</span> {safeString((selected as any).time || '—')}
                    </div>
                    <div>
                      <span className="font-semibold">Location:</span>{' '}
                      {safeString((selected as any).location || '—')}
                    </div>
                    <div>
                      <span className="font-semibold">Neighborhood:</span>{' '}
                      {safeString((selected as any).neighborhood || '—')}
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span>{' '}
                      {safeString((selected as any).event_type || '—')}
                    </div>
                    <div>
                      <span className="font-semibold">Pricing:</span>{' '}
                      {safeString((selected as any).pricing_type || '—')}
                      {safeString((selected as any).price) ? ` · ${safeString((selected as any).price)}` : ''}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Description</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {safeString((selected as any).description || '—')}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Internal notes</div>
                      <div className="text-xs text-gray-500">Only admins can see this.</div>
                    </div>
                    <button
                      disabled={savingNotes}
                      onClick={() => void saveNotes(Number((selected as any).id), notesDraft)}
                      className="rounded-lg bg-purple-700 px-3 py-2 text-xs font-bold text-white hover:bg-purple-800 disabled:opacity-60"
                    >
                      {savingNotes ? 'Saving…' : 'Save notes'}
                    </button>
                  </div>

                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
                    rows={4}
                    placeholder="Add notes, next steps, links, etc."
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Status</span>
                    <select
                      value={((selected as any).status as SubmissionStatus) ?? 'new'}
                      onChange={(e) =>
                        void updateStatus(Number((selected as any).id), e.target.value as SubmissionStatus)
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {safeString((selected as any).instagram_url) && (
                      <a
                        href={safeString((selected as any).instagram_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Instagram
                      </a>
                    )}
                    {safeString((selected as any).website_url) && (
                      <a
                        href={safeString((selected as any).website_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Website
                      </a>
                    )}
                    {safeString((selected as any).image_url) && (
                      <a
                        href={safeString((selected as any).image_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Image
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-5">
              <div className="text-xs text-gray-500">
                Tip: Use the status dropdown to move submissions through your flow. Export CSV for backups.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
