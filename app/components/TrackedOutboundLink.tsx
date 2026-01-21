'use client';

import React, { useCallback, useMemo } from 'react';

type OutboundKind = 'instagram' | 'ticket' | 'other';

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();

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

export default function TrackedOutboundLink({
  eventId,
  href,
  kind,
  pathname,
  className,
  children,
}: {
  eventId: number;
  href: string;
  kind: OutboundKind;
  pathname: string;
  className?: string;
  children: React.ReactNode;
}) {
  const payload = useMemo(() => {
    // We compute IDs at click time (not render time) to avoid SSR/client mismatch
    return { eventId, href, kind, pathname };
  }, [eventId, href, kind, pathname]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // We want to track reliably, then open in a new tab.
      e.preventDefault();
      e.stopPropagation();

      if (!payload.eventId || !payload.href) return;

      const viewer_id = getOrSetLocal('ae_viewer_id');
      const session_id = getOrSetSession('ae_session_id');
      const referrer = document.referrer || null;

      const body = JSON.stringify({
        event_id: payload.eventId,
        href: payload.href,
        kind: payload.kind,
        pathname: payload.pathname,
        viewer_id,
        session_id,
        referrer,
      });

      // Prefer sendBeacon for best chance of completing before navigation.
      let beaconOk = false;
      try {
        if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
          const blob = new Blob([body], { type: 'application/json' });
          beaconOk = navigator.sendBeacon('/api/track/outbound-click', blob);
        }
      } catch {
        beaconOk = false;
      }

      // Fallback to fetch (fire-and-forget).
      if (!beaconOk) {
        fetch('/api/track/outbound-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }

      // Open after we attempt tracking.
      window.open(payload.href, '_blank', 'noopener,noreferrer');
    },
    [payload]
  );

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  );
}
