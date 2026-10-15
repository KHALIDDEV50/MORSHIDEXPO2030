/**
 * Google Maps directions link for a real-world destination (guided mode, tourism stops only).
 * Opens Google Maps in a new tab — a plain link, not an integration: no key, no tracking, and
 * MORSHID never claims the visitor's position or arrival (D-019). Only verified coordinates.
 * https://developers.google.com/maps/documentation/urls/get-started
 */
export function googleMapsDirectionsUrl(destination: { lat: number; lng: number }): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`);
  return url.toString();
}
