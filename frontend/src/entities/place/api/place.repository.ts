import type { Page } from '@/shared/api';
import type { Collection, Place, PlaceQuery } from '../model/place';

/** api-contracts.md §3 — implemented by the demo repository today and an HTTP one later. */
export interface PlaceRepository {
  search(query: PlaceQuery, signal?: AbortSignal): Promise<Page<Place>>;
  getById(id: string, signal?: AbortSignal): Promise<Place>;
  getMany(ids: string[], signal?: AbortSignal): Promise<Place[]>;
  listCollections(signal?: AbortSignal): Promise<Collection[]>;
  listFeatured(signal?: AbortSignal): Promise<Place[]>;
}
