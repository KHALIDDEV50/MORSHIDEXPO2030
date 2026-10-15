import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollectionSchema, PlaceSchema } from '../model/place';
import { DEMO_COLLECTIONS, DEMO_PLACES } from './demo/places';
import { mockPlaceRepository, queryPlaces } from './place.mock';

const SAUDI = { north: 32.2, south: 16.3, east: 55.7, west: 34.5 };

describe('demo places data', () => {
  it('matches the Place contract, with unique ids', () => {
    for (const place of DEMO_PLACES) expect(PlaceSchema.safeParse(place).success, place.id).toBe(true);
    for (const col of DEMO_COLLECTIONS) expect(CollectionSchema.safeParse(col).success, col.id).toBe(true);
    expect(new Set(DEMO_PLACES.map((p) => p.id)).size).toBe(DEMO_PLACES.length);
  });

  it('uses sourced coordinates inside Saudi Arabia (D-023)', () => {
    for (const place of DEMO_PLACES) {
      expect(place.locationSource, place.id).toMatch(/^osm:(node|way|relation)\/\d+/);
      expect(place.location.lat).toBeGreaterThan(SAUDI.south);
      expect(place.location.lat).toBeLessThan(SAUDI.north);
      expect(place.location.lng).toBeGreaterThan(SAUDI.west);
      expect(place.location.lng).toBeLessThan(SAUDI.east);
    }
  });

  it('labels unverifiable data as demo and keeps references valid', () => {
    const ids = new Set(DEMO_PLACES.map((p) => p.id));
    for (const place of DEMO_PLACES) {
      if (place.openingHours) expect(place.openingHours.provenance).toBe('demo');
      // Images: a labelled placeholder, or a local licensed photo with its credit, license and source
      for (const image of place.images) {
        if (image.placeholder) continue;
        expect(image.src).toMatch(/^\/images\/places\/[a-z0-9-]+\.jpg$/);
        expect(image.credit).toBeTruthy();
        expect(image.license).toMatch(/^(CC0|Public domain|CC BY(-SA)? \d)/);
        expect(image.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      }
      for (const related of place.relatedPlaceIds) expect(ids.has(related), `${place.id} → ${related}`).toBe(true);
      for (const col of place.collectionIds) expect(DEMO_COLLECTIONS.find((c) => c.id === col)?.placeIds).toContain(place.id);
    }
    for (const col of DEMO_COLLECTIONS) for (const id of col.placeIds) expect(ids.has(id), `${col.id} → ${id}`).toBe(true);
  });
});

describe('queryPlaces', () => {
  it('filters by category, region and family-friendliness', () => {
    const museums = queryPlaces(DEMO_PLACES, { locale: 'en', categories: ['museums'] });
    expect(museums.length).toBeGreaterThan(0);
    expect(museums.every((p) => p.categories.includes('museums'))).toBe(true);
    expect(queryPlaces(DEMO_PLACES, { locale: 'en', regionCode: 'saudi' }).every((p) => p.region.regionCode === 'saudi')).toBe(true);
    expect(queryPlaces(DEMO_PLACES, { locale: 'en', familyFriendly: true }).some((p) => p.id === 'plc_edge_world')).toBe(false);
  });

  it('searches Arabic and English names, ignoring letter variants', () => {
    expect(queryPlaces(DEMO_PLACES, { locale: 'en', q: 'masmak' })[0]?.id).toBe('plc_masmak');
    expect(queryPlaces(DEMO_PLACES, { locale: 'ar', q: 'المصمك' })[0]?.id).toBe('plc_masmak');
    expect(queryPlaces(DEMO_PLACES, { locale: 'ar', q: 'الحجر' }).map((p) => p.id)).toContain('plc_hegra');
    expect(queryPlaces(DEMO_PLACES, { locale: 'en', q: 'zzzz-nothing' })).toEqual([]);
  });

  it('limits "nearby" to the visible map bounds', () => {
    const oldRiyadh = { north: 24.65, south: 24.62, east: 46.72, west: 46.7 };
    const ids = queryPlaces(DEMO_PLACES, { locale: 'en', bounds: oldRiyadh }).map((p) => p.id).sort();
    expect(ids).toEqual(['plc_masmak', 'plc_murabba', 'plc_national_museum', 'plc_souq_zal'].sort());
  });

  it('sorts by duration and by name', () => {
    const byDuration = queryPlaces(DEMO_PLACES, { locale: 'en', sort: 'duration' }).map((p) => p.suggestedDurationMin);
    expect(byDuration).toEqual([...byDuration].sort((a, b) => a - b));
    const byName = queryPlaces(DEMO_PLACES, { locale: 'en', sort: 'name' }).map((p) => p.name.en);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b, 'en')));
  });
});

describe('mockPlaceRepository', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const settle = async <T,>(promise: Promise<T>) => {
    const result = promise.then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    await vi.runAllTimersAsync();
    return result;
  };

  it('pages search results', async () => {
    const res = await settle(mockPlaceRepository.search({ locale: 'en', page: 1, pageSize: 5 }));
    expect(res.ok && res.value.items.length).toBe(5);
    expect(res.ok && res.value.total).toBe(DEMO_PLACES.length);
  });

  it('returns NOT_FOUND for unknown ids and skips them in getMany', async () => {
    const missing = await settle(mockPlaceRepository.getById('plc_nope'));
    expect(!missing.ok && missing.error).toMatchObject({ code: 'NOT_FOUND' });
    const many = await settle(mockPlaceRepository.getMany(['plc_masmak', 'plc_nope']));
    expect(many.ok && many.value.map((p) => p.id)).toEqual(['plc_masmak']);
  });
});
