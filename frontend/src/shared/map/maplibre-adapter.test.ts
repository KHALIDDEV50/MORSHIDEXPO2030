import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MapInstance } from './types';

/**
 * Adapter behaviour against a fake `maplibre-gl` module (jsdom has no WebGL).
 * Regression guard for the missing "Old Riyadh in one day" route line: at `style.load` on a tiled
 * basemap, `isStyleLoaded()` is still false (tiles loading), and the overlays must be added anyway.
 */
type Handler = (payload?: unknown) => void;

class FakeMap {
  static last: FakeMap | undefined;
  handlers = new Map<string, Handler[]>();
  sources = new Map<string, { data: unknown; setData: (d: unknown) => void }>();
  layers: { id: string; filter?: unknown }[] = [];
  styleCalls: [unknown, Record<string, unknown> | undefined][] = [];
  filters = new Map<string, unknown>();
  touchZoomRotate = { disableRotation: () => {} };
  constructor(public options: Record<string, unknown>) {
    FakeMap.last = this;
  }
  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }
  once(event: string, handler: Handler) {
    return this.on(event, handler);
  }
  fire(event: string, payload?: unknown) {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
  addControl() {}
  setStyle(style: unknown, options?: Record<string, unknown>) {
    this.styleCalls.push([style, options]);
  }
  /** Tiles still loading — the condition that used to skip the route layers */
  isStyleLoaded() {
    return false;
  }
  getLayer(id: string) {
    return this.layers.find((l) => l.id === id);
  }
  addLayer(layer: { id: string }) {
    this.layers.push(layer);
  }
  removeLayer(id: string) {
    this.layers = this.layers.filter((l) => l.id !== id);
  }
  getSource(id: string) {
    return this.sources.get(id);
  }
  addSource(id: string, spec: { data: unknown }) {
    const source = { data: spec.data, setData: (d: unknown) => (source.data = d) };
    this.sources.set(id, source);
  }
  removeSource(id: string) {
    this.sources.delete(id);
  }
  setFilter(id: string, filter: unknown) {
    this.filters.set(id, filter);
  }
  /** Simulates a full style reload: everything we added is gone */
  wipeStyle() {
    this.layers = [];
    this.sources.clear();
  }
  getBounds() {
    return { getWest: () => 46, getSouth: () => 24, getEast: () => 47, getNorth: () => 25, contains: () => true };
  }
  getCanvas() {
    return document.createElement('canvas');
  }
  getZoom() {
    return 11;
  }
  queryRenderedFeatures() {
    return [];
  }
  easeTo() {}
  fitBounds() {}
  resize() {}
  remove() {}
}

class FakeMarker {
  element: HTMLElement;
  constructor(options: { element: HTMLElement }) {
    this.element = options.element;
  }
  setLngLat() {
    return this;
  }
  addTo() {
    document.body.appendChild(this.element);
    return this;
  }
  remove() {
    this.element.remove();
  }
  getElement() {
    return this.element;
  }
}

vi.mock('maplibre-gl', () => ({
  Map: FakeMap,
  Marker: FakeMarker,
  NavigationControl: class {},
  setWorkerUrl: () => {},
  getVersion: () => '6.11.2',
}));

const { maplibreAdapter } = await import('./maplibre-adapter');

async function mountGeo(): Promise<{ map: FakeMap; instance: MapInstance }> {
  FakeMap.last = undefined;
  const promise = maplibreAdapter.mount(document.createElement('div'), { mode: 'geo', theme: 'light', locale: 'en' });
  await vi.waitFor(() => expect(FakeMap.last).toBeDefined());
  const map = FakeMap.last!;
  map.fire('style.load');
  map.fire('load');
  return { map, instance: await promise };
}

type LineData = { geometry: { coordinates: [number, number][] } };
const coords = (map: FakeMap, source: string) => (map.sources.get(source)?.data as LineData).geometry.coordinates;

const STOPS = [
  { id: 'masmak', position: { lat: 24.631249, lng: 46.7133285 } },
  { id: 'souq', position: { lat: 24.628967, lng: 46.7122379 } },
  { id: 'murabba', position: { lat: 24.646465, lng: 46.7091452 } },
  { id: 'turaif', position: { lat: 24.7329962, lng: 46.5733836 } },
];

afterEach(() => {
  document.body.innerHTML = '';
});

describe('maplibre adapter — plan route line', () => {
  it('adds the route layers at style.load even while tiles are still loading', async () => {
    const { map } = await mountGeo();
    const ids = map.layers.map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(['morshid-line-halo', 'morshid-line-rest', 'morshid-line-done']));
    expect(map.sources.has('morshid-line-all')).toBe(true);
  });

  it('draws the stops in visit order as [lng, lat], split into done (solid) and remaining (dashed)', async () => {
    const { map, instance } = await mountGeo();
    instance.setMarkers(STOPS);
    instance.setOrderLine({ ids: ['masmak', 'souq', 'murabba', 'turaif'], progressIndex: 2 });

    expect(coords(map, 'morshid-line-all')).toEqual(STOPS.map((s) => [s.position.lng, s.position.lat]));
    expect(coords(map, 'morshid-line-done')).toEqual(STOPS.slice(0, 3).map((s) => [s.position.lng, s.position.lat]));
    expect(coords(map, 'morshid-line-rest')).toEqual(STOPS.slice(2).map((s) => [s.position.lng, s.position.lat]));
    // The remaining part is dashed, the done part solid
    const rest = map.layers.find((l) => l.id === 'morshid-line-rest') as unknown as { paint: Record<string, unknown> };
    const done = map.layers.find((l) => l.id === 'morshid-line-done') as unknown as { paint: Record<string, unknown> };
    expect(rest.paint['line-dasharray']).toBeDefined();
    expect(done.paint['line-dasharray']).toBeUndefined();
  });

  it('draws the route lines above the basemap (added last)', async () => {
    const { map } = await mountGeo();
    const ids = map.layers.map((l) => l.id);
    expect(ids.slice(-3)).toEqual(['morshid-line-halo', 'morshid-line-rest', 'morshid-line-done']);
  });

  it('restores the route after a theme switch reloads the style', async () => {
    const { map, instance } = await mountGeo();
    instance.setMarkers(STOPS);
    instance.setOrderLine({ ids: ['masmak', 'souq', 'murabba', 'turaif'], progressIndex: 0 });

    instance.setTheme('dark');
    const [, options] = map.styleCalls.at(-1)!;
    expect(options?.diff).toBe(false); // full reload → style.load fires
    map.wipeStyle();
    map.fire('style.load');

    expect(coords(map, 'morshid-line-all')).toHaveLength(4);
    expect(map.layers.map((l) => l.id)).toContain('morshid-line-rest');
  });

  it('ignores order-line ids without a marker and needs 2+ points for a line', async () => {
    const { map, instance } = await mountGeo();
    instance.setMarkers(STOPS.slice(0, 1));
    instance.setOrderLine({ ids: ['masmak', 'missing'] });
    expect(coords(map, 'morshid-line-all')).toEqual([]);
  });
});

describe('maplibre adapter — Expo site plan', () => {
  const layer = {
    extent: { width: 1000, height: 700 },
    site: [
      [20, 20],
      [980, 20],
      [980, 690],
      [20, 690],
    ] as [number, number][],
    paths: [
      [
        [500, 690],
        [500, 480],
      ],
    ] as [number, number][][],
    zones: [{ id: 'zone_a', number: 3, name: 'Innovation & Technology', color: 'violet', polygon: [[370, 40], [630, 40], [630, 230], [370, 230]] as [number, number][] }],
  };

  it('draws site, walkways, zones and numbered zone titles, and selects zones', async () => {
    FakeMap.last = undefined;
    const promise = maplibreAdapter.mount(document.createElement('div'), { mode: 'local', theme: 'light', locale: 'en', localLayer: layer });
    await vi.waitFor(() => expect(FakeMap.last).toBeDefined());
    const map = FakeMap.last!;
    map.fire('style.load');
    map.fire('load');
    const instance = await promise;

    const ids = map.layers.map((l) => l.id);
    expect(ids.indexOf('morshid-site-fill')).toBeLessThan(ids.indexOf('morshid-paths'));
    expect(ids.indexOf('morshid-paths')).toBeLessThan(ids.indexOf('morshid-zones-fill'));

    const label = document.querySelector<HTMLElement>('.morshid-zone-label')!;
    expect(label.textContent).toContain('3');
    expect(label.textContent).toContain('Innovation & Technology');

    const onZone = vi.fn();
    instance.on('zoneClick', onZone);
    map.fire('click', { originalEvent: { target: label }, point: { x: 0, y: 0 } });
    expect(onZone).toHaveBeenCalledWith('zone_a');

    instance.setSelectedZone('zone_a');
    expect(label.classList.contains('is-selected')).toBe(true);
    expect(JSON.stringify(map.filters.get('morshid-zones-selected'))).toContain('zone_a');
  });
});
