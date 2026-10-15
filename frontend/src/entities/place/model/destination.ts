import type { PlaceholderTone } from '@/shared/ui';

/** Discover categories (PRD §4.2, configurable). Heritage & Nature are categories, not pages (D-011). */
export const DESTINATION_CATEGORIES = ['heritage', 'museums', 'nature', 'food', 'shopping', 'entertainment', 'family', 'culture'] as const;
export type DestinationCategory = (typeof DESTINATION_CATEGORIES)[number];
export type DestinationRegion = 'riyadh' | 'saudi';

export const CATEGORY_TONE: Record<DestinationCategory, PlaceholderTone> = {
  heritage: 'heritage',
  museums: 'culture',
  nature: 'nature',
  food: 'food',
  shopping: 'heritage',
  entertainment: 'modern',
  family: 'nature',
  culture: 'culture',
};

/** Arabic-insensitive normalization: strips diacritics/tatweel and unifies alef / taa marbuta / yaa forms. */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[آأإ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export type DestinationFilters = {
  query: string;
  region: DestinationRegion | 'all';
  categories: ReadonlySet<DestinationCategory>;
};

/** Same filter drives every view (list, grid, map later) — PRD §4.2. */
export function filterDestinations<T extends DestinationCardData>(items: T[], { query, region, categories }: DestinationFilters): T[] {
  const q = normalizeSearch(query);
  return items.filter(
    (item) =>
      (region === 'all' || item.region === region) &&
      (categories.size === 0 || categories.has(item.category)) &&
      (!q || normalizeSearch(`${item.name} ${item.area} ${item.summary} ${item.categoryLabel}`).includes(q)),
  );
}

/** Display data for destination cards (localized strings resolved by the caller). */
/** A licensed destination photo (local file), localized alt text and its credit line. */
export type PlacePhotoData = { src: string; alt: string; credit?: string; sourceUrl?: string };

export type DestinationCardData = {
  id: string;
  name: string;
  area: string;
  region: DestinationRegion;
  category: DestinationCategory;
  categoryLabel: string;
  summary: string;
  /** Suggested visit duration, already formatted */
  duration: string;
  featured?: boolean;
  /** Short editorial line for featured cards */
  tagline?: string;
  /** Real photo when the place has a licensed one; otherwise the labelled placeholder */
  photo?: PlacePhotoData;
};
