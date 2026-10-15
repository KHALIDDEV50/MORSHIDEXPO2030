'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import type { StopRef } from '@/entities/conversation';
import { useBoothSearch, useExpoLayout, type ExpoBooth, type ExpoZone } from '@/entities/expo';
import { placeArea, usePlaceSearch, type Place } from '@/entities/place';
import { localize, type LatLng } from '@/shared/api';

/** Display data for a place or Expo booth referenced by a message, proposal or plan. */
export type ResolvedStop =
  | { kind: 'place'; id: string; name: string; categoryLabel: string; area: string; summary: string; durationMin: number; bestTime?: string; position: LatLng; place: Place }
  | { kind: 'booth'; id: string; name: string; categoryLabel: string; area: string; summary: string; durationMin: number; bestTime?: undefined; position: [number, number]; number: string; zone?: ExpoZone; booth: ExpoBooth };

export const refId = (ref: StopRef) => (ref.kind === 'place' ? ref.placeId : ref.boothId);

/**
 * Resolves stop references against the place and Expo repositories (localized). Returns null for
 * refs that no longer exist, so callers can skip them instead of showing broken cards.
 */
export function useStopRefs() {
  const locale = useLocale();
  const tc = useTranslations('discover.categories');
  const te = useTranslations('expoMap');
  const places = usePlaceSearch({ locale, pageSize: 100 });
  const booths = useBoothSearch({});
  const layout = useExpoLayout();

  const byId = useMemo(() => {
    const map = new Map<string, ResolvedStop>();
    for (const p of places.data?.items ?? []) {
      map.set(p.id, {
        kind: 'place',
        id: p.id,
        name: localize(p.name, locale),
        categoryLabel: tc(p.categories[0]!),
        area: placeArea(p, locale),
        summary: localize(p.summary, locale),
        durationMin: p.suggestedDurationMin,
        bestTime: p.bestTime ? localize(p.bestTime, locale) : undefined,
        position: p.location,
        place: p,
      });
    }
    const zones = new Map((layout.data?.zones ?? []).map((z) => [z.id, z]));
    for (const b of booths.data ?? []) {
      const zone = zones.get(b.zoneId);
      map.set(b.id, {
        kind: 'booth',
        id: b.id,
        name: localize(b.name, locale),
        categoryLabel: te(`category.${b.category}`),
        area: zone ? te('zoneShort', { number: zone.number, name: localize(zone.name, locale) }) : '',
        summary: localize(b.summary, locale),
        durationMin: b.suggestedDurationMin,
        position: b.position,
        number: b.number,
        zone,
        booth: b,
      });
    }
    return map;
  }, [places.data, booths.data, layout.data, locale, tc, te]);

  const resolve = useCallback((ref: StopRef) => byId.get(refId(ref)) ?? null, [byId]);
  return { resolve, ready: !places.isPending && !booths.isPending && !layout.isPending, layout: layout.data };
}
