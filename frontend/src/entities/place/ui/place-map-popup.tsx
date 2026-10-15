'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import type { Place } from '../model/place';
import { PlaceDetailCard, type PlaceCardData } from './place-detail-card';
import { placeArea, placePhoto } from './use-place-card-data';

/** Place → the details shown over the map (photo, category, area, duration, summary, tips, demo hours). */
export function usePlaceDetailData(): (place: Place) => PlaceCardData {
  const locale = useLocale();
  const tc = useTranslations('discover.categories');
  const formatDuration = useFormatDuration();
  return useCallback(
    (place: Place) => ({
      name: localize(place.name, locale),
      category: tc(place.categories[0]!),
      area: placeArea(place, locale),
      duration: formatDuration(place.suggestedDurationMin),
      summary: localize(place.summary, locale),
      highlights: place.tips.slice(0, 3).map((tip) => localize(tip, locale)),
      hours: place.openingHours ? localize(place.openingHours.text, locale) : undefined,
      photo: placePhoto(place, locale),
    }),
    [locale, tc, formatDuration],
  );
}

/**
 * "Place details over the map" (design-system overlay patterns): a floating card on the
 * reading-end side on wide maps, docked at the bottom on narrow ones. The map stays visible and
 * keeps its camera; ✕ or Esc closes. Tourism places only — Expo pavilions have their own details.
 * The map container must be `relative @container`.
 */
export function PlaceMapPopup({ place, actions, onClose, className }: { place: PlaceCardData; actions: ReactNode; onClose: () => void; className?: string }) {
  const headingId = useId();
  const card = useRef<HTMLDivElement>(null);

  // Keyboard users land inside the card when it opens (and when another marker is chosen)
  useEffect(() => {
    card.current?.focus({ preventScroll: true });
  }, [place.name]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      className={cn(
        'absolute z-20 flex',
        'inset-x-3 bottom-3 max-h-[78%]',
        '@3xl:inset-x-auto @3xl:end-4 @3xl:top-4 @3xl:bottom-4 @3xl:max-h-none @3xl:w-[24rem]',
        className,
      )}
    >
      <PlaceDetailCard
        ref={card}
        headingId={headingId}
        place={place}
        onClose={onClose}
        actions={actions}
        className="focus-visible:ring-focus/40 w-full outline-none focus-visible:ring-3"
      />
    </div>
  );
}
