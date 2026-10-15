import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { FilterSpecification, GeoJSONSource, LngLatBoundsLike, Map as MlMap, MapMouseEvent, Marker as MlMarker, StyleSpecification } from 'maplibre-gl';
import type { Bounds } from '@/shared/api';
import { env } from '@/shared/config/env';
import {
  boundsOfLngLats,
  DEFAULT_ZOOM,
  localBounds,
  localExtentLngLat,
  localizeLabels,
  MAP_COLORS,
  RIYADH_CENTER,
  sameBounds,
  toBounds,
  toLngLat,
  zoneColor,
} from './geo';
import type { LocalLayer, LocalPoint, MapAdapter, MapEvents, MapInitOptions, MapInstance, MapTheme, MarkerAnchor, OrderLine } from './types';

const LINE_SOURCE_ALL = 'morshid-line-all';
const LINE_SOURCE_REST = 'morshid-line-rest';
const LINE_SOURCE_DONE = 'morshid-line-done';
const ZONES_SOURCE = 'morshid-zones';
const SITE_SOURCE = 'morshid-site';
const PATHS_SOURCE = 'morshid-paths';
const OVERLAY_SOURCES = [LINE_SOURCE_ALL, LINE_SOURCE_REST, LINE_SOURCE_DONE, ZONES_SOURCE, SITE_SOURCE, PATHS_SOURCE];
const OVERLAY_LAYERS = [
  'morshid-site-fill',
  'morshid-site-outline',
  'morshid-paths-glow',
  'morshid-paths',
  'morshid-zones-fill',
  'morshid-hub-glow',
  'morshid-zones-outline',
  'morshid-zones-dim',
  'morshid-zones-selected-glow',
  'morshid-zones-selected',
  'morshid-line-halo',
  'morshid-line-rest',
  'morshid-line-done',
];

function geoStyleUrl(theme: MapTheme): string {
  return theme === 'dark' ? env.mapStyleDark : env.mapStyleLight;
}

/** Expo site plan: no basemap at all, just a themed background (D-023). */
function localStyle(theme: MapTheme): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': MAP_COLORS[theme].background } }],
  };
}

function supportsWebGL2(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

const emptyLine = (): Feature<LineString> => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });

let workerConfigured = false;
let webgl2Supported: boolean | undefined;

export const maplibreAdapter: MapAdapter = {
  provider: 'maplibre',

  isSupported() {
    // Probed once: every probe creates a WebGL context, and browsers cap live contexts
    if (typeof window === 'undefined') return true;
    webgl2Supported ??= supportsWebGL2();
    return webgl2Supported;
  },

  async mount(container, options) {
    const maplibre = await import('maplibre-gl');
    if (!workerConfigured) {
      // The worker is served from /public (scripts/copy-maplibre-worker.mjs) — see that script for why
      maplibre.setWorkerUrl(`/vendor/maplibre-gl/${maplibre.getVersion()}/maplibre-gl-worker.mjs`);
      workerConfigured = true;
    }
    return createInstance(maplibre, container, options);
  },
};

function createInstance(maplibre: typeof import('maplibre-gl'), container: HTMLElement, options: MapInitOptions): Promise<MapInstance> {
  const { mode, locale, controlLabels, reducedMotion = false } = options;
  let theme = options.theme;
  let localLayer: LocalLayer | undefined = options.localLayer;
  if (mode === 'local' && !localLayer) throw new Error('Local mode needs a localLayer');

  const extent = () => localLayer?.extent;
  type AnyListener = (payload: unknown) => void;
  const listeners = new Map<keyof MapEvents, Set<AnyListener>>();
  const emit = <E extends keyof MapEvents>(event: E, payload: MapEvents[E]) => listeners.get(event)?.forEach((l) => l(payload));

  const markers = new Map<string, { marker: MlMarker; element: HTMLElement; lngLat: [number, number] }>();
  const zoneLabels: MlMarker[] = [];
  let elementSnapshot: ReadonlyMap<string, HTMLElement> = new Map();
  let orderLine: OrderLine | null = null;
  let selectedZone: string | null = null;
  let lastBounds: Bounds | null = null;
  let destroyed = false;
  /** True once a style JSON has loaded (layers can be added) — not the same as all tiles loaded */
  let styleReady = false;

  const styleFor = (t: MapTheme) => (mode === 'local' ? localStyle(t) : geoStyleUrl(t));
  const transformStyle = (_previous: StyleSpecification | undefined, next: StyleSpecification) => (mode === 'geo' ? localizeLabels(next, locale) : next);

  const map: MlMap = new maplibre.Map({
    container,
    // Geo mode gets its style from setStyle below (so labels can be localized); `load` then waits for it
    style: mode === 'local' ? localStyle(theme) : undefined,
    center: mode === 'geo' ? [(options.center ?? RIYADH_CENTER).lng, (options.center ?? RIYADH_CENTER).lat] : undefined,
    zoom: mode === 'geo' ? (options.zoom ?? DEFAULT_ZOOM) : undefined,
    bounds: mode === 'local' && localLayer ? (localExtentLngLat(localLayer.extent, 0.02) as LngLatBoundsLike) : undefined,
    maxBounds: mode === 'local' && localLayer ? (localExtentLngLat(localLayer.extent) as LngLatBoundsLike) : undefined,
    renderWorldCopies: mode === 'geo',
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    // OpenFreeMap / OpenStreetMap attribution comes from the style; nothing to attribute in local mode
    attributionControl: mode === 'geo' ? {} : false,
    locale: controlLabels,
    fadeDuration: reducedMotion ? 0 : 300,
  });
  map.touchZoomRotate.disableRotation();
  // Zoom buttons at the inline-start top corner (the map itself is never mirrored)
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), options.dir === 'rtl' ? 'top-right' : 'top-left');
  if (mode === 'geo') map.setStyle(styleFor(theme), { transformStyle });

  // ───────────── Overlays (re-applied after every style change) ─────────────

  /** [done, remaining, whole] — coordinates are [lng, lat] in visit order */
  const lineFeatures = (): [Feature<LineString>, Feature<LineString>, Feature<LineString>] => {
    if (!orderLine) return [emptyLine(), emptyLine(), emptyLine()];
    const coords = orderLine.ids.map((id) => markers.get(id)?.lngLat).filter((c): c is [number, number] => Boolean(c));
    const split = Math.max(0, Math.min(orderLine.progressIndex ?? 0, coords.length - 1));
    const done = coords.slice(0, split + 1);
    const rest = coords.slice(split);
    const asLine = (c: [number, number][]) => ({ ...emptyLine(), geometry: { type: 'LineString' as const, coordinates: c.length > 1 ? c : [] } });
    return [asLine(done), asLine(rest), asLine(coords)];
  };

  const ring = (points: LocalPoint[]) => [...points, points[0]!].map((p) => toLngLat(p, localLayer!.extent));

  const zoneFeatures = (): FeatureCollection => ({
    type: 'FeatureCollection',
    features: (localLayer?.zones ?? []).map((zone) => ({
      type: 'Feature',
      properties: { zid: zone.id, color: zoneColor(zone.color), kind: zone.kind ?? 'theme' },
      geometry: { type: 'Polygon', coordinates: [ring(zone.polygon)] },
    })),
  });

  const siteFeatures = (): FeatureCollection => ({
    type: 'FeatureCollection',
    features: localLayer?.site ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring(localLayer.site)] } }] : [],
  });

  const pathFeatures = (): FeatureCollection => ({
    type: 'FeatureCollection',
    features: (localLayer?.paths ?? []).map((path) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: path.map((p) => toLngLat(p, localLayer!.extent)) },
    })),
  });

  const selectedZoneFilter = () => ['==', ['get', 'zid'], selectedZone ?? ''] as unknown as FilterSpecification;
  /** Every zone except the selected one (nothing when no zone is selected) — dimmed to focus the eye */
  const dimFilter = () => (selectedZone ? ['!=', ['get', 'zid'], selectedZone] : ['==', ['get', 'zid'], '']) as unknown as FilterSpecification;

  /**
   * Runs on every `style.load`, i.e. once the style JSON is parsed. Do NOT gate this on
   * `map.isStyleLoaded()`: in MapLibre 6 that also waits for every tile source to finish
   * loading, which is never true at `style.load` on a tiled basemap — that check silently
   * skipped the route layers on the tourism map (the Expo plan has no tiles, so it worked there).
   */
  const applyOverlays = () => {
    if (destroyed) return;
    styleReady = true;
    const palette = MAP_COLORS[theme];
    for (const id of OVERLAY_LAYERS) if (map.getLayer(id)) map.removeLayer(id);
    for (const id of OVERLAY_SOURCES) if (map.getSource(id)) map.removeSource(id);

    if (mode === 'local') {
      // Site plan hierarchy: ground → walkways → zones (fill, outline) → selected zone
      map.addSource(SITE_SOURCE, { type: 'geojson', data: siteFeatures() });
      map.addSource(PATHS_SOURCE, { type: 'geojson', data: pathFeatures() });
      map.addSource(ZONES_SOURCE, { type: 'geojson', data: zoneFeatures() });
      // Site plan hierarchy: ground → lit walkways (soft glow + core) → zones → plaza glow → dim
      // the unselected zones → selected outline (glow + crisp). Effects stay restrained (P-023).
      const roundLine = { 'line-cap': 'round', 'line-join': 'round' } as const;
      const zoomWidth = (min: number, max: number) => ['interpolate', ['exponential', 2], ['zoom'], 11, min, 16, max] as unknown as number;
      map.addLayer({ id: 'morshid-site-fill', type: 'fill', source: SITE_SOURCE, paint: { 'fill-color': palette.site } });
      map.addLayer({ id: 'morshid-site-outline', type: 'line', source: SITE_SOURCE, paint: { 'line-color': palette.siteLine, 'line-width': 1.5 } });
      map.addLayer({
        id: 'morshid-paths-glow',
        type: 'line',
        source: PATHS_SOURCE,
        layout: roundLine,
        paint: { 'line-color': palette.pathGlow, 'line-opacity': palette.pathGlowOpacity, 'line-width': zoomWidth(10, 220), 'line-blur': zoomWidth(8, 160) },
      });
      map.addLayer({
        id: 'morshid-paths',
        type: 'line',
        source: PATHS_SOURCE,
        layout: roundLine,
        // Walkway width follows the zoom (wider when zoomed in), like a drawn site plan
        paint: { 'line-color': palette.path, 'line-opacity': 0.9, 'line-width': zoomWidth(1.6, 40) },
      });
      map.addLayer({ id: 'morshid-zones-fill', type: 'fill', source: ZONES_SOURCE, paint: { 'fill-color': ['get', 'color'], 'fill-opacity': palette.zoneOpacity } });
      map.addLayer({
        id: 'morshid-hub-glow',
        type: 'line',
        source: ZONES_SOURCE,
        filter: ['==', ['get', 'kind'], 'hub'] as unknown as FilterSpecification,
        layout: roundLine,
        paint: { 'line-color': MAP_COLORS.cyan, 'line-opacity': theme === 'dark' ? 0.55 : 0.4, 'line-width': zoomWidth(6, 120), 'line-blur': zoomWidth(5, 100) },
      });
      map.addLayer({
        id: 'morshid-zones-outline',
        type: 'line',
        source: ZONES_SOURCE,
        layout: { 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-opacity': palette.zoneLine, 'line-width': 1.5 },
      });
      map.addLayer({ id: 'morshid-zones-dim', type: 'fill', source: ZONES_SOURCE, filter: dimFilter(), paint: { 'fill-color': palette.dim, 'fill-opacity': palette.dimOpacity } });
      map.addLayer({
        id: 'morshid-zones-selected-glow',
        type: 'line',
        source: ZONES_SOURCE,
        filter: selectedZoneFilter(),
        layout: { 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-opacity': 0.45, 'line-width': 12, 'line-blur': 8 },
      });
      map.addLayer({
        id: 'morshid-zones-selected',
        type: 'line',
        source: ZONES_SOURCE,
        filter: selectedZoneFilter(),
        layout: { 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 3 },
      });
    }

    const [done, rest, all] = lineFeatures();
    map.addSource(LINE_SOURCE_ALL, { type: 'geojson', data: all });
    map.addSource(LINE_SOURCE_DONE, { type: 'geojson', data: done });
    map.addSource(LINE_SOURCE_REST, { type: 'geojson', data: rest });
    const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const;
    // Added last → drawn above every basemap layer; HTML markers always sit above the canvas.
    // The halo runs under both parts so the line reads on light and dark tiles.
    map.addLayer({ id: 'morshid-line-halo', type: 'line', source: LINE_SOURCE_ALL, layout: lineLayout, paint: { 'line-color': palette.halo, 'line-width': 9, 'line-opacity': 0.9 } });
    map.addLayer({ id: 'morshid-line-rest', type: 'line', source: LINE_SOURCE_REST, layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-color': palette.lineRest, 'line-width': 4, 'line-dasharray': [2, 1.6] } });
    map.addLayer({ id: 'morshid-line-done', type: 'line', source: LINE_SOURCE_DONE, layout: lineLayout, paint: { 'line-color': MAP_COLORS.pink, 'line-width': 5 } });
  };

  const updateLine = () => {
    if (!styleReady) return; // applyOverlays will draw the current line once the style is in
    const [done, rest, all] = lineFeatures();
    (map.getSource(LINE_SOURCE_ALL) as GeoJSONSource | undefined)?.setData(all);
    (map.getSource(LINE_SOURCE_DONE) as GeoJSONSource | undefined)?.setData(done);
    (map.getSource(LINE_SOURCE_REST) as GeoJSONSource | undefined)?.setData(rest);
  };

  /**
   * Zone titles as HTML labels: a numbered badge in the zone color + the name (local mode has no
   * glyphs; HTML also shapes Arabic natively). They are pointer targets for selecting the zone;
   * keyboard users select zones from the synchronized list, so labels stay out of the a11y tree.
   */
  const renderZoneLabels = () => {
    zoneLabels.splice(0).forEach((m) => m.remove());
    if (mode !== 'local' || !localLayer) return;
    for (const zone of localLayer.zones) {
      const xs = zone.polygon.map(([x]) => x);
      const ys = zone.polygon.map(([, y]) => y);
      const el = document.createElement('div');
      el.className = 'morshid-zone-label';
      el.dataset.zoneId = zone.id;
      el.setAttribute('aria-hidden', 'true');
      el.dir = 'auto';
      el.classList.toggle('is-selected', zone.id === selectedZone);
      el.classList.toggle('is-dimmed', Boolean(selectedZone) && zone.id !== selectedZone);
      el.classList.toggle('is-hub', zone.kind === 'hub');
      el.style.setProperty('--zone-color', zoneColor(zone.color));
      const badge = document.createElement('span');
      badge.className = 'morshid-zone-number';
      badge.textContent = String(zone.number);
      const title = document.createElement('span');
      title.className = 'morshid-zone-title';
      title.textContent = zone.name;
      el.append(badge, title);
      const at = zone.labelAt ?? [Math.min(...xs) + 10, Math.min(...ys) + 10];
      zoneLabels.push(new maplibre.Marker({ element: el, anchor: 'top-left' }).setLngLat(toLngLat(at, localLayer.extent)).addTo(map));
    }
  };

  // ───────────── Events ─────────────

  const currentBounds = (): Bounds => {
    const b = map.getBounds();
    const geo = toBounds([
      [b.getWest(), b.getSouth()],
      [b.getEast(), b.getNorth()],
    ]);
    return mode === 'local' && localLayer ? localBounds(geo, localLayer.extent) : geo;
  };

  const emitBounds = () => {
    const bounds = currentBounds();
    if (sameBounds(lastBounds, bounds)) return;
    lastBounds = bounds;
    emit('boundsChange', bounds);
  };

  function zoneAt(e: MapMouseEvent): string | null {
    if (!styleReady || !map.getLayer('morshid-zones-fill')) return null;
    const zid = map.queryRenderedFeatures(e.point, { layers: ['morshid-zones-fill'] })[0]?.properties?.zid;
    return typeof zid === 'string' ? zid : null;
  }

  map.on('style.load', applyOverlays);
  map.on('moveend', emitBounds);
  map.on('error', (e) => emit('error', e.error instanceof Error ? e.error : new Error(String(e.error))));
  map.on('click', (e: MapMouseEvent) => {
    const target = e.originalEvent.target as Element | null;
    // Clicks on our HTML markers bubble through the canvas container first — they are not map clicks
    if (target?.closest?.('.morshid-marker')) return;
    if (mode === 'local') {
      const label = target?.closest?.<HTMLElement>('.morshid-zone-label');
      const zoneId = label?.dataset.zoneId ?? zoneAt(e);
      if (zoneId) {
        emit('zoneClick', zoneId);
        return;
      }
    }
    if (mode === 'geo') {
      // Base-map POIs (OpenStreetMap). Our own places are HTML markers and handle their own clicks.
      const poi = map.queryRenderedFeatures(e.point).find((f) => f.sourceLayer === 'poi' && f.properties?.name);
      if (poi) {
        const props = poi.properties as Record<string, unknown>;
        const name = String((locale === 'ar' ? props['name:ar'] : (props[`name:${locale}`] ?? props['name:en'] ?? props.name_en)) ?? props.name);
        emit('poiClick', { name, category: typeof props.class === 'string' ? props.class : null, position: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
        return;
      }
    }
    emit('backgroundClick', undefined);
  });
  map.on('mousemove', (e: MapMouseEvent) => {
    const hit =
      mode === 'local'
        ? Boolean(zoneAt(e))
        : map.queryRenderedFeatures(e.point).some((f) => f.sourceLayer === 'poi' && f.properties?.name);
    map.getCanvas().style.cursor = hit ? 'pointer' : '';
  });

  // ───────────── Instance ─────────────

  const fitLngLats = (points: [number, number][]) => {
    const box = boundsOfLngLats(points);
    if (!box) return;
    const duration = reducedMotion ? 0 : 600;
    if (points.length === 1) {
      map.easeTo({ center: points[0]!, zoom: Math.max(map.getZoom(), mode === 'geo' ? 15 : map.getZoom()), duration });
      return;
    }
    map.fitBounds(box as LngLatBoundsLike, { padding: 56, maxZoom: mode === 'geo' ? 16 : 22, duration });
  };

  const instance: MapInstance = {
    setMarkers(anchors: MarkerAnchor[]) {
      let changed = false;
      const keep = new Set(anchors.map((a) => a.id));
      for (const [id, entry] of markers) {
        if (!keep.has(id)) {
          entry.marker.remove();
          markers.delete(id);
          changed = true;
        }
      }
      for (const anchor of anchors) {
        const lngLat = toLngLat(anchor.position, extent());
        const existing = markers.get(anchor.id);
        if (existing) {
          existing.marker.setLngLat(lngLat);
          existing.lngLat = lngLat;
          continue;
        }
        const element = document.createElement('div');
        element.className = 'morshid-marker';
        element.dataset.markerId = anchor.id;
        const marker = new maplibre.Marker({ element, anchor: 'center' }).setLngLat(lngLat).addTo(map);
        markers.set(anchor.id, { marker, element, lngLat });
        changed = true;
      }
      updateLine();
      if (changed) {
        elementSnapshot = new Map([...markers].map(([id, entry]) => [id, entry.element]));
        emit('markers', undefined);
      }
    },

    getMarkerElements: () => elementSnapshot,

    setOrderLine(line) {
      orderLine = line;
      updateLine();
    },

    setSelected(id) {
      for (const [markerId, { element }] of markers) element.classList.toggle('is-selected', markerId === id);
      if (id) instance.reveal(id);
    },

    setSelectedZone(id) {
      selectedZone = id;
      zoneLabels.forEach((m) => {
        const el = m.getElement();
        el.classList.toggle('is-selected', el.dataset.zoneId === id);
        el.classList.toggle('is-dimmed', Boolean(id) && el.dataset.zoneId !== id);
      });
      if (styleReady && map.getLayer('morshid-zones-selected')) {
        map.setFilter('morshid-zones-selected', selectedZoneFilter());
        map.setFilter('morshid-zones-selected-glow', selectedZoneFilter());
        map.setFilter('morshid-zones-dim', dimFilter());
      }
    },

    reveal(id) {
      const entry = markers.get(id);
      if (entry && !map.getBounds().contains(entry.lngLat)) map.easeTo({ center: entry.lngLat, duration: reducedMotion ? 0 : 500 });
    },

    fitTo(ids) {
      const points = (ids ?? [...markers.keys()]).map((id) => markers.get(id)?.lngLat).filter((p): p is [number, number] => Boolean(p));
      if (points.length) fitLngLats(points);
      else if (mode === 'local' && localLayer) map.fitBounds(localExtentLngLat(localLayer.extent, 0.02) as LngLatBoundsLike, { duration: 0 });
    },

    focusZone(zoneId) {
      if (mode !== 'local' || !localLayer) return;
      const zone = zoneId ? localLayer.zones.find((z) => z.id === zoneId) : undefined;
      const duration = reducedMotion ? 0 : 700;
      if (!zone) {
        map.fitBounds(localExtentLngLat(localLayer.extent, 0.02) as LngLatBoundsLike, { duration });
        return;
      }
      const box = boundsOfLngLats(zone.polygon.map((p) => toLngLat(p, localLayer!.extent)));
      if (box) map.fitBounds(box as LngLatBoundsLike, { padding: 48, duration });
    },

    getBounds: currentBounds,

    on(event, listener) {
      const set = listeners.get(event) ?? new Set<AnyListener>();
      listeners.set(event, set);
      set.add(listener as AnyListener);
      return () => {
        set.delete(listener as AnyListener);
      };
    },

    setTheme(next) {
      if (next === theme) return;
      theme = next;
      // diff: false forces a full reload so `style.load` fires and our layers are re-added
      // (a diffed swap fires no style.load and drops layers that aren't in the new style)
      styleReady = false;
      map.setStyle(styleFor(next), { transformStyle, diff: false });
    },

    setLocalLayer(layer) {
      localLayer = layer;
      renderZoneLabels();
      if (!styleReady) return;
      (map.getSource(ZONES_SOURCE) as GeoJSONSource | undefined)?.setData(zoneFeatures());
      (map.getSource(SITE_SOURCE) as GeoJSONSource | undefined)?.setData(siteFeatures());
      (map.getSource(PATHS_SOURCE) as GeoJSONSource | undefined)?.setData(pathFeatures());
    },

    resize: () => map.resize(),

    destroy() {
      if (destroyed) return;
      destroyed = true;
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      zoneLabels.forEach((m) => m.remove());
      map.remove();
    },
  };

  renderZoneLabels();

  return new Promise((resolve, reject) => {
    let settled = false;
    map.once('load', () => {
      settled = true;
      emitBounds();
      emit('ready', undefined);
      resolve(instance);
    });
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      instance.destroy();
      reject(error);
    };
    // A style that never loads (offline, blocked tiles) must not leave the UI waiting forever.
    // Single tile errors after the style has loaded are not fatal.
    // Only a style that never loads is fatal; a failing tile once the style is in is not.
    map.on('error', (e) => {
      if (!styleReady) fail(e.error instanceof Error ? e.error : new Error('Map failed to load'));
    });
    setTimeout(() => fail(new Error('Map load timed out')), 20_000);
  });
}
