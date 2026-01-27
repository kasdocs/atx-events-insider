import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export type EnsureResult = {
  latitude: number | null;
  longitude: number | null;
  geocode_place_name: string | null;
  google_maps_href: string | null;
  reason?: string | null;
};

function buildGoogleMapsHref(locationText: string) {
  const q = encodeURIComponent(locationText);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export async function ensureEventGeocoded(eventId: number): Promise<EnsureResult> {
  const supabase = createSupabaseAdminClient();

  // Pull what we need
  const { data: event, error } = await supabase
    .from('events')
    .select('id, location, neighborhood, latitude, longitude, geocode_place_name, geocode_status')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return {
      latitude: null,
      longitude: null,
      geocode_place_name: null,
      google_maps_href: null,
      reason: 'Event not found.',
    };
  }

  const locationText = [event.location, event.neighborhood].filter(Boolean).join(', ').trim();
  const googleMapsHref = event.location ? buildGoogleMapsHref(locationText) : null;

  // If already has coords, we are done
  if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
    return {
      latitude: event.latitude,
      longitude: event.longitude,
      geocode_place_name: event.geocode_place_name ?? null,
      google_maps_href: googleMapsHref,
      reason: null,
    };
  }

  // If no location text, cannot geocode
  if (!locationText) {
    return {
      latitude: null,
      longitude: null,
      geocode_place_name: null,
      google_maps_href: null,
      reason: 'Missing location text.',
    };
  }

  // Temporary: return no coords but provide Maps link
  // (This avoids blocking your build while you wire Mapbox geocoding.)
  return {
    latitude: null,
    longitude: null,
    geocode_place_name: null,
    google_maps_href: googleMapsHref,
    reason: 'Geocoding not yet executed.',
  };
}
