'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { EXPO_SITE, type ExpoLayout } from '@/entities/expo';
import type { DerivedStop, PlanType } from '@/entities/plan';
import { localize } from '@/shared/api';
import { MapView, type LocalLayer, type MapViewMarker } from '@/shared/map';
import type { TripItem } from '../model/use-plan-trip';

/**
 * A plan on the map (tourism: real map; Expo: the illustrative site plan): start, numbered stops,
 * end, statuses (current / completed / overdue) and the visit-order line (solid = done). Not a
 * road route and no live position (D-019/D-023).
 */
export function PlanRouteMap({
  type,
  items,
  progressIndex,
  layout,
  selectedId,
  onSelect,
  className,
}: {
  type: PlanType;
  items: DerivedStop<TripItem>[];
  progressIndex: number;
  /** Expo site layout (only needed for Expo plans) */
  layout?: ExpoLayout;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  const t = useTranslations('planDetails');
  const locale = useLocale();

  const markers = useMemo<MapViewMarker[]>(
    () =>
      items
        .filter((s) => s.mapPosition)
        .map((s) => ({
          id: s.id,
          position: s.mapPosition!,
          kind: s.kind,
          status: s.status,
          number: s.number,
          label: `${s.kind === 'start' ? t('startLabel') : s.kind === 'destination' ? t('endLabel') : t('stopNumber', { number: s.number ?? 0 })}: ${s.name} — ${t(`status.${s.status}`)}`,
        })),
    [items, t],
  );
  const orderLine = useMemo(() => ({ ids: markers.map((m) => m.id), progressIndex }), [markers, progressIndex]);

  const localLayer = useMemo<LocalLayer | undefined>(
    () =>
      layout && {
        extent: EXPO_SITE,
        site: layout.site,
        paths: layout.paths,
        zones: layout.zones.map((z) => ({ id: z.id, number: z.number, name: localize(z.name, locale), color: z.color, polygon: z.polygon, labelAt: z.labelAt })),
      },
    [layout, locale],
  );

  if (type === 'expo') {
    if (!localLayer) return <div className={className} aria-busy="true" />;
    return <MapView mode="local" label={t('mapLabel')} localLayer={localLayer} markers={markers} orderLine={orderLine} selectedId={selectedId} onSelect={onSelect} fitToMarkers={false} className={className} />;
  }
  return <MapView mode="geo" label={t('mapLabel')} markers={markers} orderLine={orderLine} selectedId={selectedId} onSelect={onSelect} className={className} />;
}
