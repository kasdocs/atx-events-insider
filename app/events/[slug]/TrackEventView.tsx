'use client';

import { useEffect } from 'react';

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();

  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrSetLocal(key: string) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const v = uuid();
    localStorage.setItem(key, v);
    return v;
  } catch {
    return uuid();
  }
}

function getOrSetSession(key: string) {
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const v = uuid();
    sessionStorage.setItem(key, v);
    return v;
  } catch {
    return uuid();
  }
}

export default function TrackEventView({ eventId, pathname }: { eventId: number; pathname: string }) {
  useEffect(() => {
    if (!eventId) return;

    const viewer_id = getOrSetLocal('ae_viewer_id');
    const session_id = getOrSetSession('ae_session_id');
    const referrer = document.referrer || null;

    // fire and forget
    fetch('/api/track/event-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        pathname,
        referrer,
        viewer_id,
        session_id,
      }),
    }).catch(() => {});
  }, [eventId, pathname]);

  return null;
}
