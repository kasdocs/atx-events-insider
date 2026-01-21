'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { downloadTextFile, formatDateTimeMaybe, toCsvValue } from '../lib/adminUtils';
import { EmptyState, ErrorBanner, LoadingState, PrimaryButton, SecondaryButton, SectionHeader } from './AdminUI';

type PopularRow = {
  event_id: number;
  slug: string | null;
  title: string | null;
  unique_viewers: number | null;
  total_views: number | null;
  last_viewed_at: string | null;

  // Engagement metrics (may be absent until API is updated)
  saves?: number | null;
  going?: number | null;
  instagram_clicks?: number | null;
  ticket_clicks?: number | null;
  outbound_clicks?: number | null;
};

type ApiResponse = { items: unknown } | { error: string };

type SortKey =
  | 'total_views'
  | 'unique_viewers'
  | 'last_viewed_at'
  | 'title'
  | 'saves'
  | 'going'
  | 'instagram_clicks'
  | 'ticket_clicks'
  | 'outbound_clicks';

type SortDir = 'desc' | 'asc';

const TOP_N_OPTIONS = [10, 25, 50] as const;

function safeNumber(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function safeNumberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function safeStringOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function normalizeRows(items: unknown): PopularRow[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      event_id: safeNumber(r.event_id),
      slug: safeStringOrNull(r.slug),
      title: safeStringOrNull(r.title),
      unique_viewers: safeNumberOrNull(r.unique_viewers),
      total_views: safeNumberOrNull(r.total_views),
      last_viewed_at: safeStringOrNull(r.last_viewed_at),

      saves: safeNumberOrNull(r.saves),
      going: safeNumberOrNull(r.going),
      instagram_clicks: safeNumberOrNull(r.instagram_clicks),
      ticket_clicks: safeNumberOrNull(r.ticket_clicks),
      outbound_clicks: safeNumberOrNull(r.outbound_clicks),
    };
  });
}

function compareDates(aIso: string | null, bIso: string | null): number {
  const a = aIso ? new Date(aIso).getTime() : 0;
  const b = bIso ? new Date(bIso).getTime() : 0;
  return a - b;
}

function withinLastDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const windowMs = days * 24 * 60 * 60 * 1000;
  return Date.now() - t <= windowMs;
}

function sortRows(rows: PopularRow[], key: SortKey, dir: SortDir): PopularRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  const copy = [...rows];

  copy.sort((a, b) => {
    switch (key) {
      case 'title': {
        const av = (a.title ?? '').toLowerCase();
        const bv = (b.title ?? '').toLowerCase();
        return av.localeCompare(bv) * sign;
      }
      case 'unique_viewers':
        return ((a.unique_viewers ?? 0) - (b.unique_viewers ?? 0)) * sign;
      case 'last_viewed_at':
        return compareDates(a.last_viewed_at, b.last_viewed_at) * sign;
      case 'saves':
        return ((a.saves ?? 0) - (b.saves ?? 0)) * sign;
      case 'going':
        return ((a.going ?? 0) - (b.going ?? 0)) * sign;
      case 'instagram_clicks':
        return ((a.instagram_clicks ?? 0) - (b.instagram_clicks ?? 0)) * sign;
      case 'ticket_clicks':
        return ((a.ticket_clicks ?? 0) - (b.ticket_clicks ?? 0)) * sign;
      case 'outbound_clicks':
        return ((a.outbound_clicks ?? 0) - (b.outbound_clicks ?? 0)) * sign;
      case 'total_views':
      default:
        return ((a.total_views ?? 0) - (b.total_views ?? 0)) * sign;
    }
  });

  return copy;
}

export default function MostViewedEvents() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PopularRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Controls
  const [topN, setTopN] = useState<(typeof TOP_N_OPTIONS)[number]>(10);
  const [query, setQuery] = useState('');
  const [minTotalViews, setMinTotalViews] = useState<number>(0);
  const [minUniqueViewers, setMinUniqueViewers] = useState<number>(0);
  const [lastViewedWindow, setLastViewedWindow] = useState<'all' | '7' | '30' | '90'>('all');

  // API-level sort toggle (Unique vs Total)
  const [apiSort, setApiSort] = useState<'unique' | 'total'>('unique');

  // Table sort (client-side)
  const [sortKey, setSortKey] = useState<SortKey>('total_views');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = async (limit: number) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/admin/analytics/most-viewed?limit=${encodeURIComponent(String(limit))}&sort=${encodeURIComponent(apiSort)}`,
        { method: 'GET' }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const json: ApiResponse = (await res.json()) as ApiResponse;

      if ('error' in json) {
        throw new Error(json.error);
      }

      setRows(normalizeRows((json as { items: unknown }).items));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(topN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topN, apiSort]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      const title = (r.title ?? '').toLowerCase();
      const slug = (r.slug ?? '').toLowerCase();

      if (q) {
        const hay = `${title} ${slug}`;
        if (!hay.includes(q)) return false;
      }

      if (minTotalViews > 0 && (r.total_views ?? 0) < minTotalViews) return false;
      if (minUniqueViewers > 0 && (r.unique_viewers ?? 0) < minUniqueViewers) return false;

      if (lastViewedWindow !== 'all') {
        const days = Number(lastViewedWindow);
        if (!withinLastDays(r.last_viewed_at, days)) return false;
      }

      return true;
    });

    return sortRows(filtered, sortKey, sortDir);
  }, [rows, query, minTotalViews, minUniqueViewers, lastViewedWindow, sortKey, sortDir]);

  const summary = useMemo(() => {
    const totalViews = filteredSorted.reduce((acc, r) => acc + (r.total_views ?? 0), 0);
    const totalUnique = filteredSorted.reduce((acc, r) => acc + (r.unique_viewers ?? 0), 0);

    const totalSaves = filteredSorted.reduce((acc, r) => acc + (r.saves ?? 0), 0);
    const totalGoing = filteredSorted.reduce((acc, r) => acc + (r.going ?? 0), 0);
    const totalIG = filteredSorted.reduce((acc, r) => acc + (r.instagram_clicks ?? 0), 0);
    const totalTickets = filteredSorted.reduce((acc, r) => acc + (r.ticket_clicks ?? 0), 0);
    const totalOutbound = filteredSorted.reduce((acc, r) => acc + (r.outbound_clicks ?? 0), 0);

    return {
      totalViews,
      totalUnique,
      totalSaves,
      totalGoing,
      totalIG,
      totalTickets,
      totalOutbound,
      count: filteredSorted.length,
    };
  }, [filteredSorted]);

  const onToggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('desc');
      return;
    }
    setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'desc' ? ' ↓' : ' ↑';
  };

  const exportCsv = () => {
    const header = [
      'event_id',
      'slug',
      'title',
      'unique_viewers',
      'total_views',
      'saves',
      'going',
      'instagram_clicks',
      'ticket_clicks',
      'outbound_clicks',
      'last_viewed_at',
    ];

    const lines = [
      header.map(toCsvValue).join(','),
      ...filteredSorted.map((r) =>
        [
          r.event_id,
          r.slug ?? '',
          r.title ?? '',
          r.unique_viewers ?? 0,
          r.total_views ?? 0,
          r.saves ?? 0,
          r.going ?? 0,
          r.instagram_clicks ?? 0,
          r.ticket_clicks ?? 0,
          r.outbound_clicks ?? 0,
          r.last_viewed_at ?? '',
        ]
          .map(toCsvValue)
          .join(',')
      ),
    ];

    const fname = `most-viewed-events_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadTextFile(fname, lines.join('\n'), 'text/csv;charset=utf-8');
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <SectionHeader
        title="Most Viewed Events"
        subtitle="Based on event page views tracked in your analytics tables."
        right={
          <>
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setApiSort('unique')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md ${
                  apiSort === 'unique' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Unique
              </button>
              <button
                type="button"
                onClick={() => setApiSort('total')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md ${
                  apiSort === 'total' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Total
              </button>
            </div>

            <SecondaryButton onClick={() => void fetchData(topN)} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </SecondaryButton>

            <PrimaryButton onClick={exportCsv} disabled={loading || filteredSorted.length === 0}>
              Export CSV
            </PrimaryButton>
          </>
        }
      />

      {errorMsg ? <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} /> : null}

      <div className="grid gap-3 md:grid-cols-12 mb-5">
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or slug..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Top N</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value) as (typeof TOP_N_OPTIONS)[number])}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Min total views</label>
          <input
            inputMode="numeric"
            value={String(minTotalViews)}
            onChange={(e) => setMinTotalViews(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Min unique viewers</label>
          <input
            inputMode="numeric"
            value={String(minUniqueViewers)}
            onChange={(e) => setMinUniqueViewers(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Last viewed</label>
          <select
            value={lastViewedWindow}
            onChange={(e) => setLastViewedWindow(e.target.value as 'all' | '7' | '30' | '90')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Showing <span className="font-semibold">{summary.count}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Total views <span className="font-semibold tabular-nums">{summary.totalViews}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Total unique <span className="font-semibold tabular-nums">{summary.totalUnique}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Saves <span className="font-semibold tabular-nums">{summary.totalSaves}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Going <span className="font-semibold tabular-nums">{summary.totalGoing}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          IG clicks <span className="font-semibold tabular-nums">{summary.totalIG}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Ticket clicks <span className="font-semibold tabular-nums">{summary.totalTickets}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          Outbound <span className="font-semibold tabular-nums">{summary.totalOutbound}</span>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading popularity..." />
      ) : filteredSorted.length === 0 ? (
        <EmptyState
          title="No matches"
          subtitle="Try adjusting filters, or wait for more event page activity."
          action={
            <SecondaryButton
              onClick={() => {
                setQuery('');
                setMinTotalViews(0);
                setMinUniqueViewers(0);
                setLastViewedWindow('all');
              }}
            >
              Reset filters
            </SecondaryButton>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('title')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Event{sortIndicator('title')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('unique_viewers')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Unique{sortIndicator('unique_viewers')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('total_views')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Total{sortIndicator('total_views')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('saves')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Saves{sortIndicator('saves')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('going')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Going{sortIndicator('going')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('instagram_clicks')}
                    className="font-semibold hover:text-gray-800"
                  >
                    IG{sortIndicator('instagram_clicks')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('ticket_clicks')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Tickets{sortIndicator('ticket_clicks')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('outbound_clicks')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Outbound{sortIndicator('outbound_clicks')}
                  </button>
                </th>

                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleSort('last_viewed_at')}
                    className="font-semibold hover:text-gray-800"
                  >
                    Last Viewed{sortIndicator('last_viewed_at')}
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSorted.map((r) => (
                <tr key={r.event_id} className="border-b last:border-b-0">
                  <td className="py-3 pr-3">
                    <Link
  href={`/admin/events/${r.event_id}/analytics`}
  className="font-semibold text-gray-900 hover:underline"
>
  {r.title ?? `Event #${r.event_id}`}
</Link>


                    {r.slug ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Link
                          className="text-xs text-purple-700 hover:underline"
                          href={`/events/${r.slug}`}
                          target="_blank"
                        >
                          /events/{r.slug}
                        </Link>
                        <span className="text-xs text-gray-400">•</span>
                        <button
                          type="button"
                          className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                `${window.location.origin}/events/${r.slug}`
                              );
                            } catch {
                              // ignore
                            }
                          }}
                        >
                          Copy link
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">No slug</div>
                    )}
                  </td>

                  <td className="py-3 pr-3 tabular-nums">{r.unique_viewers ?? 0}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.total_views ?? 0}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.saves ?? 0}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.going ?? 0}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.instagram_clicks ?? 0}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.ticket_clicks ?? 0}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.outbound_clicks ?? 0}</td>
                  <td className="py-3 pr-3 text-gray-700">
                    {formatDateTimeMaybe(r.last_viewed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 text-xs text-gray-500">Tip: Click column headers to sort.</div>
        </div>
      )}
    </section>
  );
}
