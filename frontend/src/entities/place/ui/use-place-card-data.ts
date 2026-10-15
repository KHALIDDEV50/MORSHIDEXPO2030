'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { localize } from '@/shared/api';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import type { DestinationCardData, PlacePhotoData } from '../model/destination';
import type { Place } from '../model/place';

/** Area line for a place: "District · City" (or just the city). */
export function placeArea(place: Place, locale: string): string {
  const city = localize(place.region.city, locale);
  return place.region.district ? `${localize(place.region.district, locale)} · ${city}` : city;
}

/** The place's first real (non-placeholder) photo, localized; undefined → placeholder. */
export function placePhoto(place: Place, locale: string): PlacePhotoData | undefined {
  const image = place.images.find((i) => !i.placeholder && i.src);
  return image ? { src: image.src, alt: localize(image.alt, locale), credit: image.credit, sourceUrl: image.sourceUrl } : undefined;
}

/**
 * Maps a Place (repository data) to the approved destination-card display data, localized for
 * the current language. The first category is the card's primary category.
 */
export function usePlaceCardData(): (place: Place) => DestinationCardData {
  const locale = useLocale();
  const t = useTranslations('discover.categories');
  const formatDuration = useFormatDuration();
  return useCallback(
    (place: Place): DestinationCardData => {
      const category = place.categories[0]!;
      return {
        id: place.id,
        name: localize(place.name, locale),
        area: placeArea(place, locale),
        region: place.region.regionCode,
        category,
        categoryLabel: t(category),
        summary: localize(place.summary, locale),
        duration: formatDuration(place.suggestedDurationMin),
        featured: place.featured,
        tagline: localize(place.summary, locale),
        photo: placePhoto(place, locale),
      };
    },
    [locale, t, formatDuration],
  );
}
