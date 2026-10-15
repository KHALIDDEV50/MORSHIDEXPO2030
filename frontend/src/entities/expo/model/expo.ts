import { z } from 'zod';
import { LocalizedTextSchema } from '@/shared/api';

/**
 * Expo 2030 venue model (api-contracts.md §2, D-012/D-023). Separate from tourism places:
 * positions are LOCAL site-plan coordinates (x 0–1000, y 0–700), not GPS. All Expo data is
 * illustrative demo data — official zones and pavilions are not published, and this layout must
 * never be presented as the official Expo 2030 Riyadh site plan.
 */
export const EXPO_BOOTH_CATEGORIES = ['ai-tech', 'sustainability', 'culture', 'mobility', 'health', 'countries', 'events'] as const;
export const EXPO_FACILITY_KINDS = ['entrance', 'restroom', 'prayer', 'info', 'food', 'firstaid', 'transport'] as const;

/** Site-plan extent for local coordinates */
export const EXPO_SITE = { width: 1000, height: 700 } as const;

/**
 * A CONCEPT RENDERING of the future Expo 2030 Riyadh site (supplied with the project in
 * `expo-images/`). Never a photograph of a built place and never an official site plan: the UI
 * always labels it "Concept rendering". Source and usage rights still need confirming.
 */
export const ExpoConceptImageSchema = z.object({
  src: z.string(),
  alt: LocalizedTextSchema,
  kind: z.literal('concept-rendering'),
  credit: z.string(),
});

const LocalPointSchema = z.tuple([z.number().min(0).max(EXPO_SITE.width), z.number().min(0).max(EXPO_SITE.height)]);
/** Location number shown on the map and in the list: "<zone number>.<index>", e.g. "3.2" */
const LocationNumberSchema = z.string().regex(/^\d+\.\d+$/);

export const ExpoZoneSchema = z.object({
  id: z.string().startsWith('zone_'),
  /** Zone number, also the prefix of every location number in it */
  number: z.number().int().positive(),
  name: LocalizedTextSchema,
  summary: LocalizedTextSchema,
  /** Color token: blue | pink | violet | amber | green | orange | teal | slate */
  color: z.string(),
  polygon: z.array(LocalPointSchema).min(3),
  /** Top-start corner of the zone title on the map */
  labelAt: LocalPointSchema.optional(),
  /**
   * `theme` = one of the four thematic districts (P-023); `hub` = the central plaza with the
   * gate and visitor services (not a theme). Missing = theme (older payloads).
   */
  kind: z.enum(['theme', 'hub']).optional(),
  image: ExpoConceptImageSchema.optional(),
  provenance: z.literal('demo'),
});

export const ExpoBoothSchema = z.object({
  id: z.string().startsWith('booth_'),
  zoneId: z.string().startsWith('zone_'),
  number: LocationNumberSchema,
  name: LocalizedTextSchema,
  category: z.enum(EXPO_BOOTH_CATEGORIES),
  summary: LocalizedTextSchema,
  description: LocalizedTextSchema,
  activities: z.array(z.object({ title: LocalizedTextSchema, time: z.string().regex(/^\d{2}:\d{2}$/).optional() })),
  suggestedDurationMin: z.number().int().positive(),
  position: LocalPointSchema,
  images: z.array(
    z.object({
      src: z.string(),
      alt: LocalizedTextSchema,
      placeholder: z.boolean(),
      /** A photo of the pavilion's theme, not of the (fictional) pavilion — always captioned as such */
      illustrative: z.boolean().optional(),
      credit: z.string().optional(),
      license: z.string().optional(),
      sourceUrl: z.string().url().optional(),
    }),
  ),
  provenance: z.literal('demo'),
});

export const ExpoFacilitySchema = z.object({
  id: z.string().startsWith('fac_'),
  zoneId: z.string().startsWith('zone_'),
  number: LocationNumberSchema,
  kind: z.enum(EXPO_FACILITY_KINDS),
  name: LocalizedTextSchema,
  position: LocalPointSchema,
});

export const ExpoLayoutSchema = z.object({
  zones: z.array(ExpoZoneSchema),
  facilities: z.array(ExpoFacilitySchema),
  /** Outer boundary of the (illustrative) site */
  site: z.array(LocalPointSchema).min(3),
  /** Promenades between zones — decorative, not navigation */
  paths: z.array(z.array(LocalPointSchema).min(2)),
  /** Whole-site imagery for the overview panel (concept renderings) */
  overviewImages: z.array(ExpoConceptImageSchema).optional(),
});

export const BoothQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(EXPO_BOOTH_CATEGORIES).optional(),
  zoneId: z.string().optional(),
});

export type ExpoZone = z.infer<typeof ExpoZoneSchema>;
export type ExpoConceptImage = z.infer<typeof ExpoConceptImageSchema>;

/** The four thematic districts (excludes the central plaza hub). */
export const isThemeZone = (zone: Pick<ExpoZone, 'kind'>) => zone.kind !== 'hub';
export type ExpoBooth = z.infer<typeof ExpoBoothSchema>;
export type ExpoBoothCategory = ExpoBooth['category'];
export type ExpoFacility = z.infer<typeof ExpoFacilitySchema>;
export type ExpoFacilityKind = ExpoFacility['kind'];
export type ExpoLayout = z.infer<typeof ExpoLayoutSchema>;
export type BoothQuery = z.infer<typeof BoothQuerySchema>;

// ───────────── Numbered locations (one list for map + legend + side list) ─────────────

/** A numbered point on the site plan: a pavilion/attraction (booth) or a visitor facility. */
export type ExpoLocation =
  | { type: 'booth'; id: string; number: string; zoneId: string; position: [number, number]; booth: ExpoBooth }
  | { type: 'facility'; id: string; number: string; zoneId: string; position: [number, number]; facility: ExpoFacility };

/** Numeric compare of location numbers ("3.10" after "3.2"). */
export function compareLocationNumbers(a: string, b: string): number {
  const [aZone = 0, aIndex = 0] = a.split('.').map(Number);
  const [bZone = 0, bIndex = 0] = b.split('.').map(Number);
  return aZone - bZone || aIndex - bIndex;
}

/** Booths and facilities merged into one list, ordered by their visible numbers. */
export function expoLocations(booths: ExpoBooth[], facilities: ExpoFacility[]): ExpoLocation[] {
  return [
    ...booths.map((booth): ExpoLocation => ({ type: 'booth', id: booth.id, number: booth.number, zoneId: booth.zoneId, position: booth.position, booth })),
    ...facilities.map((facility): ExpoLocation => ({ type: 'facility', id: facility.id, number: facility.number, zoneId: facility.zoneId, position: facility.position, facility })),
  ].sort((a, b) => compareLocationNumbers(a.number, b.number));
}

/** Ray-casting point-in-polygon test (local coordinates). */
export function pointInPolygon([x, y]: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
