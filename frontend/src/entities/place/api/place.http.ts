import { z } from 'zod';
import { pageSchema, request } from '@/shared/api';
import { CollectionSchema, PlaceSchema } from '../model/place';
import type { PlaceRepository } from './place.repository';

/**
 * HTTP implementation against the PROPOSED endpoints (api-contracts.md §4). Not connected yet:
 * it only works once NEXT_PUBLIC_DATA_SOURCE=http and a backend exist.
 */
export const httpPlaceRepository: PlaceRepository = {
  search: (q, signal) =>
    request('/places', {
      signal,
      schema: pageSchema(PlaceSchema),
      query: {
        q: q.q,
        category: q.categories,
        region: q.regionCode,
        maxDuration: q.maxDurationMin,
        family: q.familyFriendly,
        indoor: q.indoor,
        bounds: q.bounds ? [q.bounds.west, q.bounds.south, q.bounds.east, q.bounds.north].join(',') : undefined,
        sort: q.sort,
        page: q.page,
        pageSize: q.pageSize,
        locale: q.locale,
      },
    }),
  getById: (id, signal) => request(`/places/${encodeURIComponent(id)}`, { signal, schema: PlaceSchema }),
  getMany: (ids, signal) => request('/places', { signal, schema: pageSchema(PlaceSchema), query: { ids } }).then((p) => p.items),
  listCollections: (signal) => request('/collections', { signal, schema: z.array(CollectionSchema) }),
  listFeatured: (signal) => request('/places', { signal, schema: pageSchema(PlaceSchema), query: { featured: true } }).then((p) => p.items),
};
