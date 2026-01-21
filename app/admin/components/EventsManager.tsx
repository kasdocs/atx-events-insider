'use client';

import { useEffect, useMemo, useState } from 'react';
import { downloadTextFile, formatEventLabel, toCsvValue } from '../lib/adminUtils';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

type SortKey =
  | 'event_date'
  | 'title'
  | 'location'
  | 'pricing_type'
  | 'created_at'
  | 'updated_at';

function isoOrEmpty(v: unknown) {
  if (!v) return '';
  return String(v);
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function formatIsoToLocal(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatDateYmd(dateStr: string | null) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EventsManager() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EventRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('event_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc'); // default: soonest first (change if you want)

  const [selected, setSelected] = useState<EventRow | null>(null);

  // edits
  const [draft, setDraft] = useState<Partial<EventRow>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/events', { cache: 'no-store' });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);
      const json = JSON.parse(txt) as { items?: EventRow[] };
      setItems(json.items ?? []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load events');
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
    if (nextKey === 'event_date') setSortDir('asc');
    else setSortDir('asc');
  }

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return items;

    return items.filter((r) => {
      const haystack = [
        (r as any).title,
        (r as any).slug,
        (r as any).location,
        (r as any).neighborhood,
        (r as any).event_type,
        (r as any).pricing_type,
        (r as any).time,
      ]
        .map((v) => (v === null || v === undefined ? '' : String(v)))
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    arr.sort((a, b) => {
      const aTitle = String((a as any).title ?? '');
      const bTitle = String((b as any).title ?? '');

      const aLoc = String((a as any).location ?? '');
      const bLoc = String((b as any).location ?? '');

      const aPricing = String((a as any).pricing_type ?? '');
      const bPricing = String((b as any).pricing_type ?? '');

      const aCreated = isoOrEmpty((a as any).created_at);
      const bCreated = isoOrEmpty((b as any).created_at);

      const aUpdated = isoOrEmpty((a as any).updated_at);
      const bUpdated = isoOrEmpty((b as any).updated_at);

      const aDate = String((a as any).event_date ?? '');
      const bDate = String((b as any).event_date ?? '');

      let cmp = 0;

      if (sortKey === 'title') cmp = aTitle.localeCompare(bTitle);
      if (sortKey === 'location') cmp = aLoc.localeCompare(bLoc);
      if (sortKey === 'pricing_type') cmp = aPricing.localeCompare(bPricing);
      if (sortKey === 'created_at') cmp = aCreated.localeCompare(bCreated);
      if (sortKey === 'updated_at') cmp = aUpdated.localeCompare(bUpdated);

      if (sortKey === 'event_date') {
        // YYYY-MM-DD: safe lexicographic compare, but handle nulls
        if (!aDate && !bDate) cmp = 0;
        else if (!aDate) cmp = 1;
        else if (!bDate) cmp = -1;
        else cmp = aDate.localeCompare(bDate);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [filtered, sortKey, sortDir]);

  function openEdit(row: EventRow) {
    setSelected(row);
    setDraft({
      title: row.title,
      slug: (row as any).slug,
      event_date: (row as any).event_date,
      time: (row as any).time,
      location: (row as any).location,
      neighborhood: (row as any).neighborhood,
      event_type: (row as any).event_type,
      pricing_type: (row as any).pricing_type,
      price: (row as any).price,
      instagram_url: (row as any).instagram_url,
      image_url: (row as any).image_url,
      description: (row as any).description,
      insider_tip: (row as any).insider_tip,
    } as Partial<EventRow>);
  }

  function closeEdit() {
    setSelected(null);
    setDraft({});
    setSaving(false);
    setDeleting(false);
  }

  async function saveEdits() {
    if (!selected) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/events/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: (selected as any).id, ...draft }),
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);

      const updated = JSON.parse(txt) as { item?: EventRow };

      // optimistic update if route returns item; otherwise patch local with draft
      setItems((prev) =>
        prev.map((r) => {
          if ((r as any).id !== (selected as any).id) return r;
          if (updated.item) return updated.item;
          return { ...(r as any), ...(draft as any) } as EventRow;
        })
      );

      setSelected((prev) => {
        if (!prev) return prev;
        if (updated.item) return updated.item;
        return { ...(prev as any), ...(draft as any) } as EventRow;
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!selected) return;
    const ok = window.confirm('Delete this event? This cannot be undone.');
    if (!ok) return;

    try {
      setDeleting(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/events/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: (selected as any).id }),
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);

      setItems((prev) => prev.filter((r) => (r as any).id !== (selected as any).id));
      closeEdit();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    const cols = [
      'id',
      'slug',
      'title',
      'event_date',
      'time',
      'location',
      'neighborhood',
      'event_type',
      'pricing_type',
      'price',
      'instagram_url',
      'image_url',
      'created_at',
      'updated_at',
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
    downloadTextFile(`events-${stamp}.csv`, csv, 'text/csv;charset=utf-8;');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Events</div>
          <div className="text-sm text-gray-600">Edit events, export CSV, and keep things clean.</div>
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
        <div className="text-sm text-gray-600">{loading ? 'Loading…' : `${sorted.length} shown`}</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, location, type, slug…"
          className="w-full sm:w-96 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('event_date')} className="hover:underline">
                  Date {sortKey === 'event_date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('title')} className="hover:underline">
                  Title {sortKey === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('location')} className="hover:underline">
                  Location {sortKey === 'location' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">Type</th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('pricing_type')} className="hover:underline">
                  Pricing {sortKey === 'pricing_type' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                  Loading events…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                  No events match your search.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const id = Number((r as any).id);
                const date = formatDateYmd((r as any).event_date ?? null);
                const title = String((r as any).title ?? 'Untitled');
                const location = String((r as any).location ?? '—');
                const eventType = String((r as any).event_type ?? '—');
                const pricing = String((r as any).pricing_type ?? '—');

                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{date}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{title}</div>
                      <div className="text-xs text-gray-500">{formatEventLabel(r as any)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{location}</td>
                    <td className="px-4 py-3 text-gray-800">{eventType}</td>
                    <td className="px-4 py-3 text-gray-800">{pricing}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-gray-900">
                  {String((selected as any).title ?? 'Untitled Event')}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Created {formatIsoToLocal((selected as any).created_at ?? null)} · Updated{' '}
                  {formatIsoToLocal((selected as any).updated_at ?? null)}
                </div>
              </div>

              <button
                onClick={closeEdit}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Title
                  </label>
                  <input
                    value={String((draft as any).title ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...(d as any), title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Slug
                  </label>
                  <input
                    value={String((draft as any).slug ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...(d as any), slug: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    value={String((draft as any).event_date ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), event_date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="2026-01-25"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Time
                  </label>
                  <input
                    value={String((draft as any).time ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...(d as any), time: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="7:00 PM"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Location
                  </label>
                  <input
                    value={String((draft as any).location ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), location: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Neighborhood
                  </label>
                  <input
                    value={String((draft as any).neighborhood ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), neighborhood: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Category (event_type)
                  </label>
                  <input
                    value={String((draft as any).event_type ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), event_type: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Pricing Type
                  </label>
                  <input
                    value={String((draft as any).pricing_type ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), pricing_type: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Free / Free with RSVP / Paid"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Price
                  </label>
                  <input
                    value={String((draft as any).price ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...(d as any), price: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Instagram URL
                  </label>
                  <input
                    value={String((draft as any).instagram_url ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), instagram_url: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Image URL
                  </label>
                  <input
                    value={String((draft as any).image_url ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), image_url: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Description
                  </label>
                  <textarea
                    value={String((draft as any).description ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), description: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Insider Tip
                  </label>
                  <textarea
                    value={String((draft as any).insider_tip ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({ ...(d as any), insider_tip: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                disabled={saving}
                onClick={() => void saveEdits()}
                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-purple-800 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>

              <button
                disabled={deleting}
                onClick={() => void deleteEvent()}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
