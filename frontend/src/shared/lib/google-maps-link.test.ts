import { describe, expect, it } from 'vitest';
import { googleMapsDirectionsUrl } from './google-maps-link';

describe('googleMapsDirectionsUrl', () => {
  it('builds a directions link to the verified coordinates (no key, no origin)', () => {
    const url = new URL(googleMapsDirectionsUrl({ lat: 24.631249, lng: 46.7133285 }));
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('destination')).toBe('24.631249,46.713329');
    expect(url.searchParams.has('origin')).toBe(false);
  });
});
