'use client';

import { useEffect, useMemo, useState } from 'react';
import { downloadTextFile, toCsvValue } from '../lib/adminUtils';
import type { Database } from '@/lib/database.types';

type SubscriberRow = Database['public']['Tables']['newsletter_subscribers']['Row'];

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

type SortKey = 'created_at' | 'email' | 'name';

export default function SubscribersManager() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SubscriberRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<SubscriberRow | null>(null);

  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc'); // newest first

  async function load() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/subscribers', { cache: 'no-store' });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Request failed: ${res.status}`);

      const json = JSON.parse(text) as { items?: SubscriberRow[] };
      setItems(json.items ?? []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load subscribers');
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
    setSortDir(nextKey === 'created_at' ? 'desc' : 'asc');
  }

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return items;

    return items.filter((r) => {
      const haystack = [
        (r as any).email,
        (r as any).name,
        (r as any).first_name,
        (r as any).last_name,
        (r as any).source,
        (r as any).notes,
      ]
        .map(safeString)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aCreated = safeString((a as any).created_at);
      const bCreated = safeString((b as any).created_at);

      const aEmail = safeString((a as any).email);
      const bEmail = safeString((b as any).email);

      const aName = safeString((a as any).name || `${safeString((a as any).first_name)} ${safeString((a as any).last_name)}`.trim());
      const bName = safeString((b as any).name || `${safeString((b as any).first_name)} ${safeString((b as any).last_name)}`.trim());

      let cmp = 0;
      if (sortKey === 'created_at') cmp = aCreated.localeCompare(bCreated);
      if (sortKey === 'email') cmp = aEmail.localeCompare(bEmail);
      if (sortKey === 'name') cmp = aName.localeCompare(bName);

      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function openDetails(row: SubscriberRow) {
    setSelected(row);
    setNotesDraft(safeString((row as any).notes));
  }

  async function saveNotes(id: number, notes: string) {
    try {
      setSavingNotes(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/subscribers/update-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes }),
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);

      setItems((prev) =>
        prev.map((r) => ((r as any).id === id ? ({ ...(r as any), notes } as SubscriberRow) : r))
      );

      setSelected((prev) =>
        prev && (prev as any).id === id ? ({ ...(prev as any), notes } as SubscriberRow) : prev
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  }

  async function deleteSubscriber(id: number) {
    const ok = window.confirm('Delete this subscriber? This cannot be undone.');
    if (!ok) return;

    try {
      setDeleting(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/subscribers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(txt || `Request failed: ${res.status}`);

      setItems((prev) => prev.filter((r) => (r as any).id !== id));
      setSelected(null);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to delete subscriber');
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    const cols = [
      'id',
      'created_at',
      'email',
      'name',
      'first_name',
      'last_name',
      'source',
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
    downloadTextFile(`newsletter-subscribers-${stamp}.csv`, csv, 'text/csv;charset=utf-8;');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Newsletter Subscribers</div>
          <div className="text-sm text-gray-600">
            Search, export, and add internal notes. (Deleting is optional.)
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
        <div className="text-sm text-gray-600">{loading ? 'Loading…' : `${sorted.length} shown`}</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, name, source, notes…"
          className="w-full sm:w-96 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('created_at')} className="hover:underline">
                  Subscribed {sortKey === 'created_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('email')} className="hover:underline">
                  Email {sortKey === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">
                <button onClick={() => toggleSort('name')} className="hover:underline">
                  Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-bold">Source</th>
              <th className="px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                  Loading subscribers…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                  No subscribers match your search.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const id = Number((r as any).id);
                const createdAt = formatIsoToLocal((r as any).created_at ?? null);
                const email = safeString((r as any).email);
                const name =
                  safeString((r as any).name) ||
                  `${safeString((r as any).first_name)} ${safeString((r as any).last_name)}`.trim() ||
                  '—';
                const source = safeString((r as any).source) || '—';

                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{name}</td>
                    <td className="px-4 py-3 text-gray-800">{source}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetails(r)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        View
                      </button>
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-gray-900">
                  {safeString((selected as any).email) || 'Subscriber'}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Subscribed {formatIsoToLocal((selected as any).created_at ?? null)}
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Identity</div>
                  <div className="mt-2 text-sm text-gray-800 space-y-1">
                    <div>
                      <span className="font-semibold">Email:</span>{' '}
                      {safeString((selected as any).email) || '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Name:</span>{' '}
                      {safeString((selected as any).name) ||
                        `${safeString((selected as any).first_name)} ${safeString((selected as any).last_name)}`.trim() ||
                        '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Source:</span> {safeString((selected as any).source) || '—'}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Internal notes</div>
                  <div className="mt-2 text-xs text-gray-500">Only admins can see this.</div>

                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
                    rows={5}
                    placeholder="Add notes, segments, context…"
                  />

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      disabled={savingNotes}
                      onClick={() => void saveNotes(Number((selected as any).id), notesDraft)}
                      className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-60"
                    >
                      {savingNotes ? 'Saving…' : 'Save notes'}
                    </button>

                    <button
                      disabled={deleting}
                      onClick={() => void deleteSubscriber(Number((selected as any).id))}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
                    >
                      {deleting ? 'Deleting…' : 'Delete subscriber'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-5">
              <div className="text-xs text-gray-500">
                Tip: Export CSV any time you want a backup or want to analyze subscriber growth.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
