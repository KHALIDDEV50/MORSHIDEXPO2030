import type { Bounds } from '@/shared/api';
import { DESTINATION_CATEGORIES, type DestinationCategory, type PlaceQuery } from '@/entities/place';

/**
 * Discover state lives in the URL (shareable, back-button friendly, survives a language switch):
 *   ?q=&cat=heritage,museums&region=riyadh&dur=120&family=1&setting=indoor&sort=name&view=map&area=w,s,e,n
 * Parsing is tolerant: unknown or invalid values are ignored instead of failing the page.
 */
export const DURATION_OPTIONS = [60, 120, 240] as const;
export type DurationLimit = (typeof DURATION_OPTIONS)[number];
export type DiscoverSort = 'relevance' | 'name' | 'duration';
export type DiscoverView = 'list' | 'map';
export type DiscoverSetting = 'indoor' | 'outdoor';

export type DiscoverParams = {
  q: string;
  categories: DestinationCategory[];
  region: 'riyadh' | 'saudi' | null;
  maxDuration: DurationLimit | null;
  family: boolean;
  setting: DiscoverSetting | null;
  sort: DiscoverSort;
  view: DiscoverView;
  /** "Search this area": the map bounds the results are limited to */
  area: Bounds | null;
};

export const EMPTY_PARAMS: DiscoverParams = {
  q: '',
  categories: [],
  region: null,
  maxDuration: null,
  family: false,
  setting: null,
  sort: 'relevance',
  view: 'list',
  area: null,
};

type ReadableParams = { get(name: string): string | null };

function parseArea(raw: string | null): Bounds | null {
  if (!raw) return null;
  const parts = raw.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [west, south, east, north] = parts as [number, number, number, number];
  if (south >= north || west >= east || south < -90 || north > 90 || west < -180 || east > 180) return null;
  return { west, south, east, north };
}

export function parseDiscoverParams(search: ReadableParams): DiscoverParams {
  const categories = (search.get('cat') ?? '')
    .split(',')
    .filter((c): c is DestinationCategory => (DESTINATION_CATEGORIES as readonly string[]).includes(c));
  const region = search.get('region');
  const dur = Number(search.get('dur'));
  const setting = search.get('setting');
  const sort = search.get('sort');
  return {
    q: (search.get('q') ?? '').slice(0, 100),
    categories: [...new Set(categories)],
    region: region === 'riyadh' || region === 'saudi' ? region : null,
    maxDuration: (DURATION_OPTIONS as readonly number[]).includes(dur) ? (dur as DurationLimit) : null,
    family: search.get('family') === '1',
    setting: setting === 'indoor' || setting === 'outdoor' ? setting : null,
    sort: sort === 'name' || sort === 'duration' ? sort : 'relevance',
    view: search.get('view') === 'map' ? 'map' : 'list',
    area: parseArea(search.get('area')),
  };
}

const round = (n: number) => Math.round(n * 1e5) / 1e5;

/** Only non-default values are written, so a clean Discover URL is just `/discover`. */
export function serializeDiscoverParams(params: DiscoverParams): string {
  const out = new URLSearchParams();
  if (params.q.trim()) out.set('q', params.q.trim());
  if (params.categories.length) out.set('cat', params.categories.join(','));
  if (params.region) out.set('region', params.region);
  if (params.maxDuration) out.set('dur', String(params.maxDuration));
  if (params.family) out.set('family', '1');
  if (params.setting) out.set('setting', params.setting);
  if (params.sort !== 'relevance') out.set('sort', params.sort);
  if (params.view !== 'list') out.set('view', params.view);
  if (params.area) out.set('area', [params.area.west, params.area.south, params.area.east, params.area.north].map(round).join(','));
  return out.toString();
}

/** The repository query for these params — the same query drives the list AND the map (PRD §4.2). */
export function toPlaceQuery(params: DiscoverParams, locale: string): PlaceQuery {
  return {
    locale,
    q: params.q.trim() || undefined,
    categories: params.categories.length ? params.categories : undefined,
    regionCode: params.region ?? undefined,
    maxDurationMin: params.maxDuration ?? undefined,
    familyFriendly: params.family ? true : undefined,
    indoor: params.setting ? params.setting === 'indoor' : undefined,
    bounds: params.area ?? undefined,
    sort: params.sort,
    pageSize: 100,
  };
}

/** Filters counted on the mobile "Filters (n)" button (search, sort and view are not filters). */
export function activeFilterCount(params: DiscoverParams): number {
  return params.categories.length + (params.region ? 1 : 0) + (params.maxDuration ? 1 : 0) + (params.family ? 1 : 0) + (params.setting ? 1 : 0) + (params.area ? 1 : 0);
}

/** Home shows the editorial sections; any search, filter or the map view switches to results. */
export function showsResults(params: DiscoverParams): boolean {
  return Boolean(params.q.trim()) || activeFilterCount(params) > 0 || params.view === 'map' || params.sort !== 'relevance';
}

export function clearFilters(params: DiscoverParams): DiscoverParams {
  return { ...EMPTY_PARAMS, view: params.view, sort: params.sort };
}
