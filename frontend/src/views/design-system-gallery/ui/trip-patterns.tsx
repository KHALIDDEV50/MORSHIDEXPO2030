'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { TripStopContent } from '@/entities/plan';
import type { GeolocationLike } from '@/features/locate-me';
import { DemoBadge, RouteMarkerVisual, SegmentedControl, type RouteStopKind, type RouteStopStatus } from '@/shared/ui';
import { TripDetails } from '@/widgets/trip-details';
import { DemoBlock, GallerySection } from './section';

const STOP_DEFS: { id: 'start' | 'masmak' | 'murabba' | 'lunch' | 'museum' | 'turaif' | 'bujairi'; kind: TripStopContent['kind']; time: string; duration: number; completed: boolean; x: number; y: number }[] = [
  { id: 'start', kind: 'start', time: '08:30', duration: 0, completed: true, x: 9, y: 10 },
  { id: 'masmak', kind: 'visit', time: '09:00', duration: 60, completed: true, x: 18, y: 26 },
  { id: 'murabba', kind: 'visit', time: '10:15', duration: 45, completed: false, x: 30, y: 13 },
  { id: 'lunch', kind: 'break', time: '11:15', duration: 60, completed: false, x: 38, y: 30 },
  { id: 'museum', kind: 'visit', time: '12:30', duration: 90, completed: false, x: 47, y: 15 },
  { id: 'turaif', kind: 'visit', time: '14:30', duration: 60, completed: false, x: 55, y: 30 },
  { id: 'bujairi', kind: 'destination', time: '15:45', duration: 0, completed: false, x: 46, y: 36 },
];

const CLOCKS = ['10:00', '11:40', '14:45', 'off'] as const;
type Clock = (typeof CLOCKS)[number];
type LocationMode = 'live' | 'denied' | 'unavailable' | 'unsupported';

/** Failure-only geolocation stand-ins (a successful position is never simulated). */
function failingGeolocation(code: 1 | 2): GeolocationLike {
  return {
    getCurrentPosition: (_ok, error) =>
      window.setTimeout(() => error?.({ code, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError), 500),
  };
}

const LEGEND: { key: string; kind: RouteStopKind; status: RouteStopStatus; number?: number }[] = [
  { key: 'start', kind: 'start', status: 'upcoming' },
  { key: 'completed', kind: 'visit', status: 'completed', number: 1 },
  { key: 'current', kind: 'visit', status: 'current', number: 2 },
  { key: 'upcoming', kind: 'visit', status: 'upcoming', number: 3 },
  { key: 'overdue', kind: 'visit', status: 'overdue', number: 4 },
  { key: 'break', kind: 'break', status: 'upcoming' },
  { key: 'destination', kind: 'destination', status: 'upcoming' },
];

export function TripPatterns() {
  const t = useTranslations('designSystem.trip');
  const [clock, setClock] = useState<Clock>('11:40');
  const [locationMode, setLocationMode] = useState<LocationMode>('live');

  const stops = useMemo<TripStopContent[]>(
    () =>
      STOP_DEFS.map((s) => ({
        id: s.id,
        kind: s.kind,
        plannedTime: s.time,
        durationMin: s.duration,
        completed: s.completed,
        position: { x: s.x, y: s.y },
        name: t(`stops.${s.id}.name`),
        area: t(`stops.${s.id}.area`),
        description: t(`stops.${s.id}.description`),
        tips: [t(`stops.${s.id}.t1`), t(`stops.${s.id}.t2`)],
      })),
    [t],
  );

  const geolocation = useMemo<GeolocationLike | null | undefined>(() => {
    if (locationMode === 'denied') return failingGeolocation(1);
    if (locationMode === 'unavailable') return failingGeolocation(2);
    if (locationMode === 'unsupported') return null;
    return undefined; // live browser
  }, [locationMode]);

  const now = clock === 'off' ? null : clock;
  const common = { title: t('planTitle'), subtitle: t('planSubtitle'), stops, now, mapLabel: t('mapLabel'), geolocation };

  return (
    <GallerySection id="trip" title={t('title')} description={t('description')}>
      <DemoBlock label={t('legend')} className="gap-x-6 gap-y-3">
        {LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-2.5">
            <RouteMarkerVisual kind={item.kind} status={item.status} number={item.number} size="md" />
            <span className="text-sm font-medium">{t(`legendItems.${item.key as 'start'}`)}</span>
          </div>
        ))}
      </DemoBlock>

      <DemoBlock label={t('demoClock')} className="flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <DemoBadge label={t('demoClock')} />
          <SegmentedControl
            label={t('demoClock')}
            value={clock}
            onValueChange={setClock}
            options={CLOCKS.map((c) => ({ value: c, label: c === 'off' ? t('notToday') : c }))}
          />
        </div>
        <p className="type-body-sm text-fg-secondary font-normal">{t('demoClockNote')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">{t('location')}</span>
          <SegmentedControl
            label={t('location')}
            value={locationMode}
            onValueChange={setLocationMode}
            options={(['live', 'denied', 'unavailable', 'unsupported'] as const).map((m) => ({ value: m, label: t(`locationModes.${m}`) }))}
          />
        </div>
        <p className="type-body-sm text-fg-secondary font-normal">{t('locationNote')}</p>
      </DemoBlock>

      <DemoBlock label={t('wide')} className="block p-0 sm:p-0">
        <TripDetails key={`wide-${locationMode}`} {...common} initialCurrentId="museum" />
      </DemoBlock>

      <DemoBlock label={t('phone')} className="justify-center bg-background">
        <div className="border-border-strong w-full max-w-[24.375rem] overflow-hidden rounded-[2.5rem] border-[6px] shadow-lg">
          <TripDetails key={`phone-${locationMode}`} {...common} initialCurrentId="museum" />
        </div>
      </DemoBlock>
    </GallerySection>
  );
}
