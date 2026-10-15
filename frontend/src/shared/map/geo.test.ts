import { describe, expect, it } from 'vitest';
import { boundsOfLngLats, localBounds, localizeLabels, localToLngLat, lngLatToLocal, sameBounds, toBounds, toLngLat, zoneColor, MAP_COLORS } from './geo';

const EXTENT = { width: 1000, height: 700 };

describe('local site-plan coordinates', () => {
  it('round-trips local points through map degrees', () => {
    for (const point of [
      [0, 0],
      [500, 350],
      [1000, 700],
      [123.4, 567.8],
    ] as [number, number][]) {
      const [x, y] = lngLatToLocal(localToLngLat(point, EXTENT), EXTENT);
      expect(x).toBeCloseTo(point[0], 6);
      expect(y).toBeCloseTo(point[1], 6);
    }
  });

  it('flips y so the top of the drawing is north', () => {
    const [, topLat] = localToLngLat([0, 0], EXTENT);
    const [, bottomLat] = localToLngLat([0, 700], EXTENT);
    expect(topLat).toBeGreaterThan(bottomLat);
  });

  it('converts visible map bounds back to drawing coordinates', () => {
    // Drawing box x 100–400, y 200–600 → south-west corner is (100, 600), north-east is (400, 200)
    const b = localBounds(toBounds([localToLngLat([100, 600], EXTENT), localToLngLat([400, 200], EXTENT)]), EXTENT);
    expect(b.west).toBeCloseTo(100);
    expect(b.east).toBeCloseTo(400);
    expect(b.north).toBeCloseTo(200); // top edge = smaller y
    expect(b.south).toBeCloseTo(600);
  });

  it('requires an extent for local points but not for lat/lng', () => {
    expect(() => toLngLat([1, 2])).toThrow();
    expect(toLngLat({ lat: 24.63, lng: 46.71 })).toEqual([46.71, 24.63]);
  });
});

describe('bounds helpers', () => {
  it('computes the box around points', () => {
    expect(boundsOfLngLats([])).toBeNull();
    expect(
      boundsOfLngLats([
        [46.7, 24.6],
        [46.5, 24.7],
        [46.6, 24.65],
      ]),
    ).toEqual([
      [46.5, 24.6],
      [46.7, 24.7],
    ]);
  });

  it('treats nearly identical bounds as the same (no event spam)', () => {
    const a = { north: 1, south: 0, east: 1, west: 0 };
    expect(sameBounds(null, a)).toBe(false);
    expect(sameBounds(a, { ...a, north: 1 + 1e-9 })).toBe(true);
    expect(sameBounds(a, { ...a, north: 1.001 })).toBe(false);
  });
});

describe('localizeLabels', () => {
  type Layer = { id: string; type: string; layout?: Record<string, unknown> };
  const style: { version: number; layers: Layer[] } = {
    version: 8,
    layers: [
      { id: 'bg', type: 'background' },
      { id: 'place', type: 'symbol', layout: { 'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']] } },
      { id: 'shield', type: 'symbol', layout: { 'text-field': ['get', 'ref'] } },
      { id: 'house', type: 'symbol', layout: { 'text-field': '{housenumber}' } },
    ],
  };

  it('uses Arabic names in Arabic, falling back to the local name', () => {
    const out = localizeLabels(style, 'ar');
    expect(out.layers[1]!.layout?.['text-field']).toEqual(['coalesce', ['get', 'name:ar'], ['get', 'name']]);
  });

  it('uses English names in English and leaves road refs / house numbers alone', () => {
    const out = localizeLabels(style, 'en');
    expect(JSON.stringify(out.layers[1]!.layout?.['text-field'])).toContain('name:en');
    expect(out.layers[2]).toBe(style.layers[2]);
    expect(out.layers[3]).toBe(style.layers[3]);
    expect(out.layers[0]).toBe(style.layers[0]);
  });
});

it('maps zone color tokens to brand colors with a safe default', () => {
  expect(zoneColor('teal')).toBe(MAP_COLORS.teal);
  expect(zoneColor('unknown')).toBe(MAP_COLORS.blue);
});
