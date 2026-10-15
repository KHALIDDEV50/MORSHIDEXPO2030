import type { Bounds, LatLng } from '@/shared/api';
import type { LocalExtent, LocalPoint, MapPosition } from './types';

/** Central Riyadh (Al-Dirah) — default camera only, never shown as a "location". */
export const RIYADH_CENTER: LatLng = { lat: 24.6309, lng: 46.7133 };
export const DEFAULT_ZOOM = 11;

export function isLocalPoint(position: MapPosition): position is LocalPoint {
  return Array.isArray(position);
}

/**
 * Local site-plan coordinates are drawn on a tiny patch of the map near 0°,0° where Web
 * Mercator is practically undistorted. 1 local unit = 0.0001°. y grows downward in the drawing,
 * so it is flipped. These are NOT real-world positions (the Expo layout is illustrative).
 */
const LOCAL_SCALE = 0.0001;

export function localToLngLat([x, y]: LocalPoint, extent: LocalExtent): [lng: number, lat: number] {
  return [x * LOCAL_SCALE, (extent.height - y) * LOCAL_SCALE];
}

export function lngLatToLocal([lng, lat]: [number, number], extent: LocalExtent): LocalPoint {
  return [lng / LOCAL_SCALE, extent.height - lat / LOCAL_SCALE];
}

/** Bounds of the local drawing in map degrees (used as maxBounds with some padding). */
export function localExtentLngLat(extent: LocalExtent, padding = 0.15): [[number, number], [number, number]] {
  const padX = extent.width * padding;
  const padY = extent.height * padding;
  return [
    [-padX * LOCAL_SCALE, -padY * LOCAL_SCALE],
    [(extent.width + padX) * LOCAL_SCALE, (extent.height + padY) * LOCAL_SCALE],
  ];
}

/** [lng, lat] for any position (local points need the extent). */
export function toLngLat(position: MapPosition, extent?: LocalExtent): [number, number] {
  if (isLocalPoint(position)) {
    if (!extent) throw new Error('Local positions need a local extent');
    return localToLngLat(position, extent);
  }
  return [position.lng, position.lat];
}

/** Smallest box containing all [lng, lat] points, or null for none. */
export function boundsOfLngLats(points: [number, number][]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  let [west, south] = points[0]!;
  let [east, north] = points[0]!;
  for (const [lng, lat] of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}

export function toBounds([[west, south], [east, north]]: [[number, number], [number, number]]): Bounds {
  return { north, south, east, west };
}

/**
 * Converts map-degree bounds back to the local drawing for `local` mode, expressed in the same
 * Bounds shape: west/east = x range, north/south = y range (north = smaller y, top of drawing).
 */
export function localBounds(bounds: Bounds, extent: LocalExtent): Bounds {
  const [west, north] = lngLatToLocal([bounds.west, bounds.north], extent);
  const [east, south] = lngLatToLocal([bounds.east, bounds.south], extent);
  return { west, east, north, south };
}

/** True when two bounds differ by less than `epsilon` on every edge (avoids event spam). */
export function sameBounds(a: Bounds | null, b: Bounds, epsilon = 1e-7): boolean {
  return Boolean(
    a &&
      Math.abs(a.north - b.north) < epsilon &&
      Math.abs(a.south - b.south) < epsilon &&
      Math.abs(a.east - b.east) < epsilon &&
      Math.abs(a.west - b.west) < epsilon,
  );
}

type StyleLike = { layers?: { type: string; layout?: Record<string, unknown> }[] };

/**
 * Shows base-map labels in the UI language (OpenMapTiles fields): Arabic → `name:ar`, otherwise
 * `name:<locale>` / `name:en`, always falling back to the local `name`. Only label fields that
 * read a name are touched (road numbers and house numbers keep their own fields).
 */
export function localizeLabels<S extends StyleLike>(style: S, locale: string): S {
  const field =
    locale === 'ar'
      ? ['coalesce', ['get', 'name:ar'], ['get', 'name']]
      : ['coalesce', ['get', `name:${locale}`], ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];
  return {
    ...style,
    layers: style.layers?.map((layer) => {
      const textField = layer.layout?.['text-field'];
      if (layer.type !== 'symbol' || textField === undefined) return layer;
      const serialized = JSON.stringify(textField);
      if (!/name/.test(serialized) || /housenumber|"ref"|\{ref\}/.test(serialized)) return layer;
      return { ...layer, layout: { ...layer.layout, 'text-field': field } };
    }),
  } as S;
}

/** Brand colors used inside the map canvas (MapLibre cannot read CSS variables). */
export const MAP_COLORS = {
  blue: '#59b6f9',
  pink: '#f842e2',
  teal: '#2dd4bf',
  violet: '#8b5cf6',
  green: '#22c55e',
  amber: '#f59e0b',
  orange: '#fb923c',
  slate: '#64748b',
  /** Restrained cyan for the Expo plaza glow (reference: cyan-lit water and pavilions) */
  cyan: '#5fd9ea',
  /*
   * Expo site plan (local mode, P-023): light = warm desert daylight; dark = the night aerial
   * of the reference — warm illuminated walkways on a dark ground, cyan only at the plaza.
   */
  light: {
    background: '#e7dcc8',
    site: '#f5eee1',
    siteLine: '#cdb994',
    path: '#e3c89a',
    pathGlow: '#efd6a8',
    pathGlowOpacity: 0.55,
    dim: '#f5eee1',
    dimOpacity: 0.62,
    halo: '#ffffff',
    /** Remaining (dashed) route: deeper blue so it reads on light tiles */
    lineRest: '#1f6fd1',
    zoneOpacity: 0.2,
    zoneLine: 0.85,
  },
  dark: {
    background: '#06080c',
    site: '#14120e',
    siteLine: '#3b3123',
    path: '#f0b45f',
    pathGlow: '#f5a948',
    pathGlowOpacity: 0.3,
    dim: '#06080c',
    dimOpacity: 0.58,
    halo: '#0b1222',
    lineRest: '#6cc0fb',
    zoneOpacity: 0.17,
    zoneLine: 0.9,
  },
} as const;

const ZONE_PALETTE: Record<string, string> = {
  blue: MAP_COLORS.blue,
  pink: MAP_COLORS.pink,
  teal: MAP_COLORS.teal,
  violet: MAP_COLORS.violet,
  green: MAP_COLORS.green,
  amber: MAP_COLORS.amber,
  orange: MAP_COLORS.orange,
  slate: MAP_COLORS.slate,
  cyan: MAP_COLORS.cyan,
};

export function zoneColor(token: string): string {
  return ZONE_PALETTE[token] ?? MAP_COLORS.blue;
}
