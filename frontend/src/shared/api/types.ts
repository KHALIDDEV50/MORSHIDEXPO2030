import { z } from 'zod';

/** Shared contract primitives (api-contracts.md §1). */
export const LocalizedTextSchema = z.object({ ar: z.string(), en: z.string() }).catchall(z.string());
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const LatLngSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
export type LatLng = z.infer<typeof LatLngSchema>;

export const BoundsSchema = z.object({ north: z.number(), south: z.number(), east: z.number(), west: z.number() });
export type Bounds = z.infer<typeof BoundsSchema>;

export const PrioritySchema = z.enum(['high', 'recommended', 'optional']);
export type Priority = z.infer<typeof PrioritySchema>;

export const ProvenanceSchema = z.enum(['verified', 'demo']);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), page: z.number().int(), pageSize: z.number().int(), total: z.number().int() });
}

/** Simple in-memory pagination for demo repositories. */
export function paginate<T>(items: T[], page = 1, pageSize = 20): Page<T> {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage, pageSize, total: items.length };
}

/** Pick a locale's text with fallback (requested → en → ar) — architecture.md §6. */
export function localize(text: LocalizedText | undefined, locale: string): string {
  if (!text) return '';
  return text[locale] ?? text.en ?? text.ar ?? '';
}

/** True when a point lies inside map bounds (no antimeridian handling needed for Saudi Arabia). */
export function inBounds(point: LatLng, bounds: Bounds): boolean {
  return point.lat <= bounds.north && point.lat >= bounds.south && point.lng <= bounds.east && point.lng >= bounds.west;
}
