import { z } from 'zod';
import { BoundsSchema, LatLngSchema, LocalizedTextSchema, ProvenanceSchema } from '@/shared/api';
import { DESTINATION_CATEGORIES } from './destination';

/** Place contract (api-contracts.md §2). Coordinates must be verified (D-023) — `locationSource` says where from. */
export const PlaceCategorySchema = z.enum(DESTINATION_CATEGORIES);

export const PlaceImageSchema = z.object({
  src: z.string(),
  alt: LocalizedTextSchema,
  /** true → render the labelled local placeholder (D-026) */
  placeholder: z.boolean(),
  /** "Author · License · Wikimedia Commons" — shown with the photo */
  credit: z.string().optional(),
  license: z.string().optional(),
  /** File page with the full license terms */
  sourceUrl: z.string().url().optional(),
});

export const PlaceSchema = z.object({
  id: z.string().startsWith('plc_'),
  name: LocalizedTextSchema,
  categories: z.array(PlaceCategorySchema).min(1),
  region: z.object({
    city: LocalizedTextSchema,
    district: LocalizedTextSchema.optional(),
    /** 'riyadh' = in Riyadh city (incl. Diriyah) · 'saudi' = outside Riyadh city */
    regionCode: z.enum(['riyadh', 'saudi']),
  }),
  location: LatLngSchema,
  /** e.g. "osm:way/1385940120 (Nominatim, 2026-10-11)" */
  locationSource: z.string().min(1),
  summary: LocalizedTextSchema,
  description: LocalizedTextSchema,
  history: LocalizedTextSchema.optional(),
  tips: z.array(LocalizedTextSchema),
  suggestedDurationMin: z.number().int().positive(),
  bestTime: LocalizedTextSchema.optional(),
  openingHours: z.object({ text: LocalizedTextSchema, provenance: ProvenanceSchema }).optional(),
  attributes: z.object({ familyFriendly: z.boolean(), indoor: z.boolean(), freeEntry: z.boolean().optional() }),
  images: z.array(PlaceImageSchema),
  narration: LocalizedTextSchema.optional(),
  featured: z.boolean(),
  collectionIds: z.array(z.string()),
  relatedPlaceIds: z.array(z.string()),
});
export type Place = z.infer<typeof PlaceSchema>;
export type PlaceCategory = z.infer<typeof PlaceCategorySchema>;

export const CollectionSchema = z.object({ id: z.string().startsWith('col_'), title: LocalizedTextSchema, placeIds: z.array(z.string()) });
export type Collection = z.infer<typeof CollectionSchema>;

export const PlaceQuerySchema = z.object({
  q: z.string().optional(),
  categories: z.array(PlaceCategorySchema).optional(),
  regionCode: z.enum(['riyadh', 'saudi']).optional(),
  maxDurationMin: z.number().int().positive().optional(),
  familyFriendly: z.boolean().optional(),
  indoor: z.boolean().optional(),
  bounds: BoundsSchema.optional(),
  sort: z.enum(['relevance', 'name', 'duration']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  locale: z.string(),
});
export type PlaceQuery = z.infer<typeof PlaceQuerySchema>;
