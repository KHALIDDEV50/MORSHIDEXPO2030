'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationErrorCode = 'unsupported' | 'insecure-context' | 'permission-denied' | 'unavailable' | 'timeout';

export type CurrentLocation = {
  lat: number;
  lng: number;
  /** Radius in metres (68% confidence) reported by the browser */
  accuracy: number;
  timestamp: number;
};

export type LocationState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'located'; location: CurrentLocation }
  | { status: 'error'; code: LocationErrorCode };

/** Minimal slice of the Geolocation API (injectable for the gallery and tests). */
export type GeolocationLike = Pick<Geolocation, 'getCurrentPosition'>;

function defaultGeolocation(): GeolocationLike | null {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator ? navigator.geolocation : null;
}

/**
 * One-shot "Where am I?" (P-008). Permission is requested only when `locate()` is called from a
 * user action; nothing is tracked in the background and no position is ever invented.
 * Arrival at a stop is never inferred — completion stays manual (D-019).
 */
export function useCurrentLocation({ geolocation }: { geolocation?: GeolocationLike | null } = {}) {
  const [state, setState] = useState<LocationState>({ status: 'idle' });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const locate = useCallback(() => {
    const geo = geolocation === undefined ? defaultGeolocation() : geolocation;
    // Only an explicit `false` means insecure (some environments leave it undefined)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setState({ status: 'error', code: 'insecure-context' });
      return;
    }
    if (!geo) {
      setState({ status: 'error', code: 'unsupported' });
      return;
    }
    setState({ status: 'locating' });
    geo.getCurrentPosition(
      (pos) => {
        if (!alive.current) return;
        setState({
          status: 'located',
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          },
        });
      },
      (err) => {
        if (!alive.current) return;
        const code: LocationErrorCode =
          err.code === 1 ? 'permission-denied' : err.code === 3 ? 'timeout' : 'unavailable';
        setState({ status: 'error', code });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }, [geolocation]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, locate, reset };
}
