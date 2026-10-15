'use client';

import { CalendarDays, Check, ChevronUp, Route as RouteIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { TripProgressSummary, TripTimeline, type TripStopContent } from '@/entities/plan';
import { LocateMePanel, type GeolocationLike } from '@/features/locate-me';
import { cn } from '@/shared/lib';
import { Button, IllustrativeMap, MapMarker, MapPin, RouteLine, toast } from '@/shared/ui';
import { useTripState } from '../model/use-trip-state';

type TripDetailsProps = {
  title: string;
  subtitle: string;
  stops: TripStopContent[];
  initialCurrentId: string | null;
  /** "HH:mm" on the plan day, or null when the plan isn't today (no overdue states) */
  now: string | null;
  /** Visible disclaimer on the illustrative map */
  mapLabel: string;
  geolocation?: GeolocationLike | null;
  className?: string;
};

/**
 * Trip details (P-010): progress summary, route timeline and an illustrative route map kept in sync.
 * Container-responsive: wide → map with a floating glass panel on the reading-end side;
 * narrow → full map with a bottom sheet (peek / expanded) and fixed actions.
 */
export function TripDetails({ title, subtitle, stops: initial, initialCurrentId, now, mapLabel, geolocation, className }: TripDetailsProps) {
  const t = useTranslations('trip');
  const trip = useTripState(initial, { initialCurrentId, now });
  const [sheetOpen, setSheetOpen] = useState(true);
  const [focusId, setFocusId] = useState<string | null>(null);

  const current = trip.stops.find((s) => s.status === 'current');
  const next = trip.stops.find((s) => s.id === trip.suggestedNextId);
  const points = trip.stops.map((s) => [s.position.x, s.position.y] as [number, number]);

  const remove = (id: string) => {
    const name = trip.stops.find((s) => s.id === id)?.name ?? '';
    const undo = trip.remove(id);
    if (undo) toast(t('removedToast', { name }), { action: { label: t('undo'), onClick: undo } });
  };

  const chooseManually = () => {
    setSheetOpen(true);
    if (trip.suggestedNextId) {
      trip.select(trip.suggestedNextId);
      setFocusId(trip.suggestedNextId);
    }
  };

  const markerLabel = (s: (typeof trip.stops)[number]) => {
    const base = s.number !== undefined ? t('marker.numbered', { n: s.number, name: s.name }) : s.name;
    const status = s.kind === 'start' ? t('status.start') : s.kind === 'destination' ? t('status.destination') : t(`status.${s.status}`);
    return `${base} — ${status}`;
  };

  return (
    <section aria-label={title} className={cn('@container relative', className)}>
      <IllustrativeMap label={mapLabel} className="h-[44rem] @3xl:h-[40rem]">
        <RouteLine points={points} progressIndex={trip.progressIndex} />
        {trip.stops.map((s) => (
          <MapPin key={s.id} x={s.position.x} y={s.position.y}>
            <MapMarker
              kind={s.kind}
              status={s.status}
              number={s.number}
              selected={trip.selectedId === s.id}
              size={s.status === 'current' ? 'lg' : 'md'}
              label={markerLabel(s)}
              onClick={() => {
                trip.select(s.id);
                setSheetOpen(true);
              }}
            />
          </MapPin>
        ))}
        <p className="type-caption text-fg-muted bg-surface/80 absolute start-3 bottom-3 z-10 hidden max-w-60 rounded-md px-2 py-1 backdrop-blur-sm @3xl:block">
          {t('routeDisclaimer')}
        </p>

        {/* Panel: floating glass card (wide) / bottom sheet (narrow) */}
        <div
          className={cn(
            'glass border-border absolute z-20 flex flex-col overflow-hidden border shadow-lg',
            'inset-x-0 bottom-0 rounded-t-2xl transition-[max-height] duration-300 ease-emphasized',
            // Open sheet leaves the top of the map (where the route sits) visible and tappable
            sheetOpen ? 'max-h-[60%]' : 'max-h-[8.5rem]',
            '@3xl:inset-x-auto @3xl:end-4 @3xl:top-4 @3xl:bottom-4 @3xl:max-h-none @3xl:w-[25rem] @3xl:rounded-2xl',
          )}
        >
          {/* Sheet handle (narrow only) */}
          <button
            type="button"
            onClick={() => setSheetOpen((o) => !o)}
            aria-expanded={sheetOpen}
            aria-label={sheetOpen ? t('sheet.collapse') : t('sheet.expand')}
            className="focus-ring flex shrink-0 cursor-pointer flex-col items-center gap-1 pt-2 @3xl:hidden"
          >
            <span className="bg-border-strong h-1.5 w-10 rounded-full" />
            <ChevronUp className={cn('text-fg-muted size-4 transition-transform', sheetOpen && 'rotate-180')} aria-hidden />
          </button>

          <header className="flex shrink-0 flex-col gap-1 px-4 pt-1 pb-3 @3xl:pt-4">
            <p className="type-caption text-fg-muted flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {subtitle}
            </p>
            <h3 className="type-h3 flex items-center gap-2">
              <RouteIcon className="text-primary size-5 shrink-0" aria-hidden />
              {title}
            </h3>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
            <div className="border-border bg-surface/70 mb-3 rounded-xl border p-3.5">
              <TripProgressSummary progress={trip.progress} stops={trip.stops} currentName={current?.name} />
            </div>
            <LocateMePanel geolocation={geolocation} onChooseStopManually={chooseManually} className="mb-4" />
            <TripTimeline
              stops={trip.stops}
              selectedId={trip.selectedId}
              expandedIds={trip.expanded}
              progressIndex={trip.progressIndex}
              onSelect={trip.select}
              onToggleExpanded={trip.toggleExpanded}
              onToggleCompleted={trip.toggleComplete}
              onSetCurrent={trip.setCurrent}
              onRemove={remove}
              focusId={focusId}
            />
          </div>

          {/* Fixed actions: never cover content (the list scrolls above them) */}
          {next && (
            <div className="border-border bg-surface/85 flex shrink-0 items-center gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="min-w-0 flex-1">
                <p className="type-caption text-fg-muted">{next.status === 'current' ? t('footer.current') : t('footer.next')}</p>
                <p className="truncate text-sm font-bold">{next.name}</p>
              </div>
              {next.status === 'current' ? (
                <Button size="sm" variant="gradient" onClick={() => trip.toggleComplete(next.id)}>
                  <Check aria-hidden />
                  {t('actions.complete')}
                </Button>
              ) : (
                <Button size="sm" onClick={() => trip.setCurrent(next.id)}>
                  {t('actions.startThis')}
                </Button>
              )}
            </div>
          )}
        </div>
      </IllustrativeMap>
    </section>
  );
}
