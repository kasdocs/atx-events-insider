'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ErrorBanner, LoadingState, SectionHeader, SecondaryButton } from '@/app/admin/components/AdminUI';
import { formatDateTimeMaybe } from '@/app/admin/lib/adminUtils';

type ApiOk = {
  event: { id: number; slug: string | null; title: string | null };
  popularity: { unique_viewers: number; total_views: number; last_viewed_at: string | null };
  engagement: {
    saves: number;
    going: number;
    outbound_clicks: number;
    instagram_clicks: number;
    ticket_clicks: number;
  };
  daily_rows: Array<{
    day: string | null;
    outbound_clicks: number;
    instagram_clicks: number;
    ticket_clicks: number;
  }>;
};

type ApiResp = ApiOk | { error: string };

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-bold tabular-nums text-gray-900">{value}</div>
    </div>
  );
}

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = useMemo(() => Number(params?.eventId), [params]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!Number.isFinite(eventId) || eventId <= 0) throw new Error('Invalid event id');

      const res = await fetch(`/api/admin/analytics/event/${encodeURIComponent(String(eventId))}`, {
        method: 'GET',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const json: ApiResp = (await res.json()) as ApiResp;

      if ('error' in json) throw new Error(json.error);

      setData(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <LoadingState label="Loading event analytics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="text-sm font-semibold text-gray-700 hover:text-purple-700"
          >
            ← Back to dashboard
          </button>

          <SecondaryButton onClick={() => void fetchData()} disabled={loading}>
            Refresh
          </SecondaryButton>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <SectionHeader
            title={data?.event.title ?? `Event #${eventId}`}
            subtitle="Per-event analytics"
            right={
              data?.event.slug ? (
                <Link
                  href={`/events/${data.event.slug}`}
                  target="_blank"
                  className="text-sm font-semibold text-purple-700 hover:underline"
                >
                  Open public page →
                </Link>
              ) : null
            }
          />

          {errorMsg ? <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} /> : null}

          {!data ? (
            <div className="text-gray-600 text-sm">No data.</div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                <StatCard label="Total views" value={data.popularity.total_views} />
                <StatCard label="Unique viewers" value={data.popularity.unique_viewers} />
                <StatCard label="Last viewed" value={formatDateTimeMaybe(data.popularity.last_viewed_at)} />
                <StatCard label="Saves" value={data.engagement.saves} />
                <StatCard label="Going" value={data.engagement.going} />
                <StatCard label="Outbound clicks" value={data.engagement.outbound_clicks} />
                <StatCard label="Instagram clicks" value={data.engagement.instagram_clicks} />
                <StatCard label="Ticket clicks" value={data.engagement.ticket_clicks} />
              </div>

              <div className="border-t pt-5">
                <div className="text-sm font-semibold text-gray-800 mb-3">Recent daily clicks (last 60 rows)</div>

                {data.daily_rows.length === 0 ? (
                  <div className="text-sm text-gray-600">No daily click rows yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-3">Day</th>
                          <th className="py-2 pr-3">Outbound</th>
                          <th className="py-2 pr-3">Instagram</th>
                          <th className="py-2 pr-3">Tickets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.daily_rows.map((r, idx) => (
                          <tr key={`${r.day ?? 'day'}-${idx}`} className="border-b last:border-b-0">
                            <td className="py-2 pr-3 text-gray-800">{r.day ?? '—'}</td>
                            <td className="py-2 pr-3 tabular-nums">{r.outbound_clicks}</td>
                            <td className="py-2 pr-3 tabular-nums">{r.instagram_clicks}</td>
                            <td className="py-2 pr-3 tabular-nums">{r.ticket_clicks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
