'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { applyLeafletIconFix } from '@/app/components/maps/leafletIconFix';

type Props = {
  lat: number;
  lng: number;
  label?: string | null;
};

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function buildDirectionsHref(lat: number, lng: number, label?: string | null) {
  const q = label?.trim() ? encodeURIComponent(label.trim()) : `${lat},${lng}`;
  // Apple Maps on iOS
  if (isIOS()) return `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}`;
  // Google Maps everywhere else
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`;
}

export default function EventLocationMap({ lat, lng, label }: Props) {
  useEffect(() => {
    applyLeafletIconFix();
  }, []);

  const center = useMemo(() => [lat, lng] as LatLngExpression, [lat, lng]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const tileUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
    : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;

  const attribution = mapboxToken ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap contributors';

  const directionsHref = buildDirectionsHref(lat, lng, label);

  return (
  <div className="w-full overflow-hidden rounded-xl border border-purple-200 bg-white">
    <div className="relative h-64 w-full sm:h-72">
      {/* Force Leaflet to be "below" overlays */}
      <div className="h-full w-full relative z-0">
        <MapContainer
          center={center}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer url={tileUrl} attribution={attribution} />
          <Marker position={center} />
        </MapContainer>
      </div>

      {/* Overlay: force ABOVE Leaflet panes/controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 z-[1000]">
        <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-lg border border-purple-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-900">Get directions</div>
            <div className="truncate text-[11px] text-gray-600">
              {label?.trim() ? label : `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </div>
          </div>

          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
          >
            Directions
          </a>
        </div>
      </div>
    </div>

    {label ? (
      <div className="px-4 py-3 text-sm text-gray-700 border-t border-purple-100">{label}</div>
    ) : null}
  </div>
);

}
