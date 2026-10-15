'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PlaceQuery } from '../model/place';
import { placeRepository as repo } from './repository';

/** Query keys — one place to invalidate from mutations (features). */
export const placeKeys = {
  all: ['places'] as const,
  search: (q: PlaceQuery) => ['places', 'search', q] as const,
  detail: (id: string) => ['places', 'detail', id] as const,
  featured: () => ['places', 'featured'] as const,
  collections: () => ['places', 'collections'] as const,
};

export function usePlaceSearch(query: PlaceQuery) {
  return useQuery({
    queryKey: placeKeys.search(query),
    queryFn: ({ signal }) => repo.search(query, signal),
    placeholderData: keepPreviousData, // keep results visible while filters change
  });
}

export function usePlace(id: string | null) {
  return useQuery({
    queryKey: placeKeys.detail(id ?? ''),
    queryFn: ({ signal }) => repo.getById(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useFeaturedPlaces() {
  return useQuery({ queryKey: placeKeys.featured(), queryFn: ({ signal }) => repo.listFeatured(signal) });
}

export function useCollections() {
  return useQuery({ queryKey: placeKeys.collections(), queryFn: ({ signal }) => repo.listCollections(signal), staleTime: Infinity });
}
