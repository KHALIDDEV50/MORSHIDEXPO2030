import { describe, expect, it } from 'vitest';
import { compareLocationNumbers, expoLocations, ExpoBoothSchema, ExpoFacilitySchema, ExpoLayoutSchema, ExpoZoneSchema, isThemeZone, pointInPolygon } from '../model/expo';
import { DEMO_BOOTHS, DEMO_FACILITIES, DEMO_PATHS, DEMO_SITE, DEMO_ZONES } from './demo/expo';
import { queryBooths } from './expo.mock';

const zoneById = new Map(DEMO_ZONES.map((z) => [z.id, z]));

describe('demo Expo site plan', () => {
  it('matches the contracts', () => {
    for (const z of DEMO_ZONES) expect(ExpoZoneSchema.safeParse(z).success, z.id).toBe(true);
    for (const b of DEMO_BOOTHS) expect(ExpoBoothSchema.safeParse(b).success, b.id).toBe(true);
    for (const f of DEMO_FACILITIES) expect(ExpoFacilitySchema.safeParse(f).success, f.id).toBe(true);
    expect(ExpoLayoutSchema.safeParse({ zones: DEMO_ZONES, facilities: DEMO_FACILITIES, site: DEMO_SITE, paths: DEMO_PATHS }).success).toBe(true);
  });

  // Updated for P-023: four thematic districts (1–4) around the central plaza hub (5)
  it('has four thematic zones (1–4) plus the central plaza hub (5), all labelled demo', () => {
    expect(DEMO_ZONES.map((z) => z.number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(DEMO_ZONES.filter(isThemeZone).map((z) => z.id)).toEqual(['zone_earth', 'zone_collaboration', 'zone_technology', 'zone_humanity']);
    expect(DEMO_ZONES.filter((z) => z.kind === 'hub').map((z) => z.id)).toEqual(['zone_plaza']);
    // Zone imagery is always a labelled concept rendering, never presented as a photograph
    expect(DEMO_ZONES.every((z) => z.image?.kind === 'concept-rendering')).toBe(true);
    expect(DEMO_ZONES.every((z) => z.provenance === 'demo')).toBe(true);
    expect(DEMO_BOOTHS.every((b) => b.provenance === 'demo')).toBe(true);
  });

  it('gives every location a unique number prefixed by its zone number', () => {
    const locations = expoLocations(DEMO_BOOTHS, DEMO_FACILITIES);
    const numbers = locations.map((l) => l.number);
    expect(new Set(numbers).size).toBe(numbers.length);
    for (const location of locations) {
      const zone = zoneById.get(location.zoneId);
      expect(zone, location.id).toBeDefined();
      expect(location.number.split('.')[0], location.id).toBe(String(zone!.number));
    }
    // Indices inside each zone run 1..n with no gaps
    for (const zone of DEMO_ZONES) {
      const indices = locations.filter((l) => l.zoneId === zone.id).map((l) => Number(l.number.split('.')[1]));
      expect(indices, zone.id).toEqual(indices.map((_, i) => i + 1));
    }
    // Every zone has at least one numbered location
    for (const zone of DEMO_ZONES) expect(locations.some((l) => l.zoneId === zone.id), zone.id).toBe(true);
  });

  it('places every location and zone title inside its zone, and zones inside the site', () => {
    for (const location of expoLocations(DEMO_BOOTHS, DEMO_FACILITIES)) {
      expect(pointInPolygon(location.position, zoneById.get(location.zoneId)!.polygon), location.number).toBe(true);
    }
    for (const zone of DEMO_ZONES) {
      if (zone.labelAt) expect(pointInPolygon(zone.labelAt, zone.polygon), zone.id).toBe(true);
      for (const point of zone.polygon) expect(pointInPolygon(point, DEMO_SITE), zone.id).toBe(true);
    }
  });

  it('keeps locations apart so numbered markers do not overlap', () => {
    const locations = expoLocations(DEMO_BOOTHS, DEMO_FACILITIES);
    for (const a of locations) {
      for (const b of locations) {
        if (a.id >= b.id) continue;
        const distance = Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]);
        expect(distance, `${a.number} ↔ ${b.number}`).toBeGreaterThanOrEqual(55);
      }
    }
  });
});

describe('location numbering helpers', () => {
  it('sorts numerically (3.10 after 3.2) and merges booths with facilities', () => {
    expect(['3.10', '3.2', '1.1', '10.1'].sort(compareLocationNumbers)).toEqual(['1.1', '3.2', '3.10', '10.1']);
    const numbers = expoLocations(DEMO_BOOTHS, DEMO_FACILITIES).map((l) => l.number);
    expect(numbers).toEqual([...numbers].sort(compareLocationNumbers));
    expect(numbers[0]).toBe('1.1');
  });

  it('detects points inside and outside a polygon', () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(pointInPolygon([5, 5], square)).toBe(true);
    expect(pointInPolygon([15, 5], square)).toBe(false);
  });
});

describe('queryBooths', () => {
  it('filters by category and zone and searches names and numbers in both languages', () => {
    expect(queryBooths(DEMO_BOOTHS, { category: 'ai-tech' }).every((b) => b.category === 'ai-tech')).toBe(true);
    expect(queryBooths(DEMO_BOOTHS, { zoneId: 'zone_plaza' }).every((b) => b.zoneId === 'zone_plaza')).toBe(true);
    expect(queryBooths(DEMO_BOOTHS, { q: 'calligraphy' }).map((b) => b.id)).toEqual(['booth_arabic_calligraphy']);
    expect(queryBooths(DEMO_BOOTHS, { q: 'الخط العربي' }).map((b) => b.id)).toContain('booth_arabic_calligraphy');
    expect(queryBooths(DEMO_BOOTHS, { q: '3.2' }).map((b) => b.id)).toEqual(['booth_ai_experience']);
  });
});
