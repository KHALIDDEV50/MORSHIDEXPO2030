import { env } from '@/shared/config/env';
import { maplibreAdapter } from './maplibre-adapter';
import type { MapAdapter } from './types';

/**
 * Provider selection (NEXT_PUBLIC_MAP_PROVIDER). Only MapLibre exists; a Google adapter needs the
 * user's explicit approval plus their own key and billing (D-023), so "google" falls back for now.
 */
let warned = false;

export function getMapAdapter(): MapAdapter {
  if (env.mapProvider === 'google' && process.env.NODE_ENV !== 'production' && !warned) {
    warned = true;
    console.warn('[map] NEXT_PUBLIC_MAP_PROVIDER=google is not implemented — using MapLibre + OpenFreeMap.');
  }
  return maplibreAdapter;
}
