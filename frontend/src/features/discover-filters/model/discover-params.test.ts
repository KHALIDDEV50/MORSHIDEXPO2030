import { describe, expect, it } from 'vitest';
import { queryPlaces } from '@/entities/place';
import { DEMO_PLACES } from '@/entities/place/api/demo/places';
import { activeFilterCount, clearFilters, EMPTY_PARAMS, parseDiscoverParams, serializeDiscoverParams, showsResults, toPlaceQuery } from './discover-params';

const parse = (qs: string) => parseDiscoverParams(new URLSearchParams(qs));

describe('discover URL params', () => {
  it('round-trips every filter through the URL', () => {
    const params = {
      ...EMPTY_PARAMS,
      q: 'masmak',
      categories: ['heritage' as const, 'museums' as const],
      region: 'riyadh' as const,
      maxDuration: 120 as const,
      family: true,
      setting: 'indoor' as const,
      sort: 'name' as const,
      view: 'map' as const,
      area: { west: 46.7, south: 24.62, east: 46.72, north: 24.65 },
    };
    expect(parse(serializeDiscoverParams(params))).toEqual(params);
  });

  it('writes nothing for defaults (clean /discover URL)', () => {
    expect(serializeDiscoverParams(EMPTY_PARAMS)).toBe('');
  });

  it('ignores invalid values instead of failing', () => {
    const p = parse('cat=heritage,nope,heritage&region=mars&dur=999&family=yes&setting=space&sort=random&view=globe&area=1,2,3');
    expect(p.categories).toEqual(['heritage']);
    expect(p.region).toBeNull();
    expect(p.maxDuration).toBeNull();
    expect(p.family).toBe(false);
    expect(p.setting).toBeNull();
    expect(p.sort).toBe('relevance');
    expect(p.view).toBe('list');
    expect(p.area).toBeNull();
    expect(parse('area=47,24,46,25').area).toBeNull(); // west > east
  });

  it('maps params to the repository query used by BOTH list and map', () => {
    const q = toPlaceQuery(parse('q=fort&cat=heritage&region=riyadh&dur=60&family=1&setting=outdoor&sort=duration'), 'en');
    expect(q).toMatchObject({ q: 'fort', categories: ['heritage'], regionCode: 'riyadh', maxDurationMin: 60, familyFriendly: true, indoor: false, sort: 'duration', locale: 'en' });
    expect(toPlaceQuery(EMPTY_PARAMS, 'ar')).toMatchObject({ q: undefined, categories: undefined, bounds: undefined, familyFriendly: undefined, indoor: undefined });
  });

  it('counts filters and decides home vs results', () => {
    expect(activeFilterCount(parse('cat=heritage,food&family=1&area=46.7,24.6,46.8,24.7'))).toBe(4);
    expect(showsResults(EMPTY_PARAMS)).toBe(false);
    expect(showsResults(parse('q=x'))).toBe(true);
    expect(showsResults(parse('view=map'))).toBe(true);
    expect(showsResults(parse('cat=food'))).toBe(true);
  });

  it('clearing filters keeps the current view and sort', () => {
    const cleared = clearFilters(parse('cat=food&view=map&sort=name&family=1'));
    expect(cleared).toMatchObject({ categories: [], family: false, view: 'map', sort: 'name' });
  });
});

describe('filters + "Search this area" against the demo places (real coordinates)', () => {
  it('limits results to the map bounds and combines with other filters', () => {
    // Old Riyadh (Al-Dirah / Al-Murabba) box
    const area = 'area=46.7,24.62,46.72,24.65';
    const inArea = queryPlaces(DEMO_PLACES, toPlaceQuery(parse(area), 'en')).map((p) => p.id).sort();
    expect(inArea).toEqual(['plc_masmak', 'plc_murabba', 'plc_national_museum', 'plc_souq_zal']);

    const museumsInArea = queryPlaces(DEMO_PLACES, toPlaceQuery(parse(`${area}&cat=museums`), 'en')).map((p) => p.id).sort();
    expect(museumsInArea).toEqual(['plc_masmak', 'plc_national_museum']);

    const indoorInArea = queryPlaces(DEMO_PLACES, toPlaceQuery(parse(`${area}&setting=indoor`), 'en')).map((p) => p.id).sort();
    expect(indoorInArea).toEqual(['plc_murabba', 'plc_national_museum']);
  });

  it('applies duration, family and region filters', () => {
    const short = queryPlaces(DEMO_PLACES, toPlaceQuery(parse('dur=60'), 'en'));
    expect(short.every((p) => p.suggestedDurationMin <= 60)).toBe(true);
    const family = queryPlaces(DEMO_PLACES, toPlaceQuery(parse('family=1'), 'en'));
    expect(family.some((p) => p.id === 'plc_edge_world')).toBe(false);
    const beyond = queryPlaces(DEMO_PLACES, toPlaceQuery(parse('region=saudi'), 'en'));
    // 'saudi' = outside Riyadh city (Edge of the World is ~100 km away)
    expect(beyond.map((p) => p.id).sort()).toEqual(
      ['plc_al_qarah', 'plc_edge_world', 'plc_elephant_rock', 'plc_hegra', 'plc_historic_jeddah', 'plc_king_fahd_fountain', 'plc_rijal_almaa', 'plc_soudah'],
    );
  });
});
