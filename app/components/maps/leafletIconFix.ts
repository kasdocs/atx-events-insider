import L from 'leaflet';

let applied = false;

export function applyLeafletIconFix() {
  if (applied) return;
  applied = true;

  // Fix default marker icon paths for bundlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}
