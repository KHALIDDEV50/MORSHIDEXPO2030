import type { Bounds, LatLng } from '@/shared/api';

/**
 * Map abstraction (architecture.md §7, D-023). UI code talks to `MapInstance`; the MapLibre
 * adapter is the only implementation today, and a Google adapter can be added behind the same
 * interface later (only with the user's approval and key).
 *
 * Two modes:
 * - `geo`: real geography (OpenFreeMap tiles). Positions are verified lat/lng.
 * - `local`: the Expo site plan — no tiles, local x/y coordinates, always labelled illustrative.
 */
export type MapMode = 'geo' | 'local';
export type MapTheme = 'light' | 'dark';

/** Local site-plan point [x, y] (y grows downward, like the drawing). */
export type LocalPoint = [x: number, y: number];
export type MapPosition = LatLng | LocalPoint;

export type LocalExtent = { width: number; height: number };

export type LocalZone = {
  id: string;
  /** Shown on the map label and used as the prefix of its locations (zone 3 → 3.1, 3.2 …) */
  number: number;
  name: string;
  /** Token name: blue | pink | violet | amber | green | orange | teal | slate | cyan */
  color: string;
  polygon: LocalPoint[];
  /** Where the zone title sits (top-start corner of the label); defaults to the polygon's top-left */
  labelAt?: LocalPoint;
  /** `hub` = a central, non-thematic area (drawn with a restrained cyan glow); default `theme` */
  kind?: 'theme' | 'hub';
};

export type LocalLayer = {
  extent: LocalExtent;
  zones: LocalZone[];
  /** Outer site boundary (drawn as the "ground" of the plan) */
  site?: LocalPoint[];
  /** Promenades / walkways between zones (decorative, not navigation) */
  paths?: LocalPoint[][];
};

/** One marker the adapter positions; its content is rendered by MapView into `element`. */
export type MarkerAnchor = { id: string; position: MapPosition };

export type OrderLine = {
  /** Marker ids in visit order */
  ids: string[];
  /** Stops up to this index are done (solid); the rest is dashed. Not a road route. */
  progressIndex?: number;
};

/** A base-map point of interest the user clicked (OpenStreetMap data, not MORSHID content). */
export type MapPoi = { name: string; category: string | null; position: LatLng };

export type MapInitOptions = {
  mode: MapMode;
  theme: MapTheme;
  locale: string;
  /** UI direction — places the engine's controls at the inline-start side */
  dir?: 'ltr' | 'rtl';
  /** Required in `local` mode */
  localLayer?: LocalLayer;
  /** Initial camera (geo mode); defaults to central Riyadh */
  center?: LatLng;
  zoom?: number;
  /** Translations for the engine's built-in controls */
  controlLabels?: Record<string, string>;
  reducedMotion?: boolean;
};

export type MapEvents = {
  boundsChange: Bounds;
  poiClick: MapPoi;
  backgroundClick: void;
  ready: void;
  error: Error;
  /** The set of marker container elements changed (see getMarkerElements) */
  markers: void;
  /** A local-layer zone (polygon or its label) was clicked */
  zoneClick: string;
};

export type Unsubscribe = () => void;

export interface MapInstance {
  /** Creates/updates/removes marker containers (emits `markers` when the set changes). */
  setMarkers(markers: MarkerAnchor[]): void;
  /** Container element per marker id — a stable snapshot until the next `markers` event. */
  getMarkerElements(): ReadonlyMap<string, HTMLElement>;
  setOrderLine(line: OrderLine | null): void;
  /** Raises the marker and brings it into view if needed */
  setSelected(id: string | null): void;
  /** Pans so the marker is visible (e.g. when it receives keyboard focus) */
  reveal(id: string): void;
  /** Highlights one local-layer zone (outline + raised label) */
  setSelectedZone(id: string | null): void;
  /** Fits the camera to these markers (default: all) */
  fitTo(ids?: string[]): void;
  /** Local mode: frame one zone (zoom into its outline), or the whole site when `null`. */
  focusZone(zoneId: string | null): void;
  /** Visible area — lat/lng in geo mode, local x/y (as north=min y …) in local mode */
  getBounds(): Bounds;
  on<E extends keyof MapEvents>(event: E, listener: (payload: MapEvents[E]) => void): Unsubscribe;
  setTheme(theme: MapTheme): void;
  setLocalLayer(layer: LocalLayer): void;
  resize(): void;
  destroy(): void;
}

export interface MapAdapter {
  readonly provider: 'maplibre' | 'google';
  /** Whether this browser can render the map (e.g. WebGL2 for MapLibre) */
  isSupported(): boolean;
  mount(container: HTMLElement, options: MapInitOptions): Promise<MapInstance>;
}
