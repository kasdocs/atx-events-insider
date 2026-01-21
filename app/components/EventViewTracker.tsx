'use client';

import { useEffect } from 'react';

export default function EventViewTracker({ eventId }: { eventId: number }) {
  useEffect(() => {
    if (!eventId) return;

    const controller = new AbortController();

    // Fire-and-forget. Your API handles session dedupe + increments.
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
      signal: controller.signal,
      // keepalive helps when users bounce quickly
      keepalive: true,
    }).catch(() => {
      // No UI needed if analytics fails
    });

    return () => controller.abort();
  }, [eventId]);

  return null;
}
