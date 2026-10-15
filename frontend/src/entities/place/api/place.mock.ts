import { ApiError, demoCall, inBounds, localize, paginate } from '@/shared/api';
import type { Place, PlaceQuery } from '../model/place';
import { normalizeSearch } from '../model/destination';
import { DEMO_COLLECTIONS, DEMO_PLACES } from './demo/places';
import type { PlaceRepository } from './place.repository';

/** Relevance: name match > summary/description match > featured (PRD §4.2 "relevance"). */
function score(place: Place, q: string, locale: string): number {
  if (!q) return place.featured ? 1 : 0;
  const name = normalizeSearch(`${place.name.ar} ${place.name.en}`);
  const body = normalizeSearch(`${localize(place.summary, locale)} ${localize(place.description, locale)} ${place.region.city.ar} ${place.region.city.en}`);
  return (name.includes(q) ? 10 : 0) + (body.includes(q) ? 3 : 0) + (place.featured ? 1 : 0);
}

/** Pure filter + sort used by the demo repository (and its contract tests). */
export function queryPlaces(places: Place[], query: PlaceQuery): Place[] {
  const q = normalizeSearch(query.q ?? '');
  const filtered = places.filter(
    (p) =>
      (!query.categories?.length || p.categories.some((c) => query.categories!.includes(c))) &&
      (!query.regionCode || p.region.regionCode === query.regionCode) &&
      (!query.maxDurationMin || p.suggestedDurationMin <= query.maxDurationMin) &&
      (query.familyFriendly === undefined || p.attributes.familyFriendly === query.familyFriendly) &&
      (query.indoor === undefined || p.attributes.indoor === query.indoor) &&
      // "Nearby" uses the real map bounds and verified coordinates (PRD §4.2 B4)
      (!query.bounds || inBounds(p.location, query.bounds)) &&
      (!q || score(p, q, query.locale) > (p.featured ? 1 : 0)),
  );
  const sort = query.sort ?? 'relevance';
  return [...filtered].sort((a, b) => {
    if (sort === 'name') return localize(a.name, query.locale).localeCompare(localize(b.name, query.locale), query.locale);
    if (sort === 'duration') return a.suggestedDurationMin - b.suggestedDurationMin;
    return score(b, q, query.locale) - score(a, q, query.locale);
  });
}

export const mockPlaceRepository: PlaceRepository = {
  search: (query, signal) => demoCall('places', () => paginate(queryPlaces(DEMO_PLACES, query), query.page, query.pageSize ?? 20), signal),
  getById: (id, signal) =>
    demoCall(
      'places',
      () => {
        const place = DEMO_PLACES.find((p) => p.id === id);
        if (!place) throw new ApiError('NOT_FOUND', `Place ${id} not found`);
        return place;
      },
      signal,
    ),
  getMany: (ids, signal) => demoCall('places', () => ids.map((id) => DEMO_PLACES.find((p) => p.id === id)).filter((p): p is Place => Boolean(p)), signal),
  listCollections: (signal) => demoCall('places', () => DEMO_COLLECTIONS, signal),
  listFeatured: (signal) => demoCall('places', () => DEMO_PLACES.filter((p) => p.featured), signal),
};
