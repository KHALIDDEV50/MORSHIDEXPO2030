import { env, usesHttp } from '@/shared/config/env';
import { httpPlaceRepository } from './place.http';
import { mockPlaceRepository } from './place.mock';
import type { PlaceRepository } from './place.repository';

/**
 * Places from the real API, except what the backend doesn't persist yet:
 * - collections: `GET /collections` is a stub returning [] → stay on demo data
 * - featured: no place is flagged featured in the backend yet → the demo picks, loaded from the API
 */
const hybridPlaceRepository: PlaceRepository = {
  ...httpPlaceRepository,
  listCollections: (signal) => mockPlaceRepository.listCollections(signal),
  listFeatured: async (signal) => {
    const live = await httpPlaceRepository.listFeatured(signal);
    if (live.length > 0) return live;
    const demoIds = (await mockPlaceRepository.listFeatured(signal)).map((p) => p.id);
    return demoIds.length ? httpPlaceRepository.getMany(demoIds, signal) : [];
  },
};

/** Implementation chosen by NEXT_PUBLIC_DATA_SOURCE (+ NEXT_PUBLIC_LIVE_DOMAINS in hybrid mode) (architecture.md §3). UI never imports demo data. */
export const placeRepository: PlaceRepository = !usesHttp('places')
  ? mockPlaceRepository
  : env.dataSource === 'hybrid'
    ? hybridPlaceRepository
    : httpPlaceRepository;
