'use client';

import { Check, ChevronDown, Crosshair, Lightbulb, MapPin, RotateCcw, Trash, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib';
import { Badge, Button, RouteMarkerVisual } from '@/shared/ui';
import { canRemove, type DerivedStop, type TripStop } from '../model/trip';
import { formatDuration } from './trip-progress';

export type TripStopContent = TripStop & {
  name: string;
  area: string;
  description: string;
  tips: string[];
};

type Props = {
  stops: DerivedStop<TripStopContent>[];
  /** Stop highlighted on the map / in the list (selection ≠ "current stop") */
  selectedId: string | null;
  expandedIds: ReadonlySet<string>;
  /** Index of the last stop reached (for the solid part of the route line) */
  progressIndex: number;
  onSelect: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onSetCurrent: (id: string) => void;
  onRemove: (id: string) => void;
  /** Focus target for "choose your current stop manually" */
  focusId?: string | null;
};

/**
 * Route timeline: a continuous line through every stop (solid where travelled, dashed ahead),
 * markers that match the map, expandable details and stop actions.
 */
export function TripTimeline({
  stops,
  selectedId,
  expandedIds,
  progressIndex,
  onSelect,
  onToggleExpanded,
  onToggleCompleted,
  onSetCurrent,
  onRemove,
  focusId,
}: Props) {
  const t = useTranslations('trip');
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const headerRefs = useRef(new Map<string, HTMLButtonElement>());

  // Keep the selected stop visible when it's chosen from the map
  useEffect(() => {
    if (!selectedId) return;
    itemRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  useEffect(() => {
    if (focusId) headerRefs.current.get(focusId)?.focus();
  }, [focusId]);

  return (
    <ol className="flex flex-col" aria-label={t('timeline.label')}>
      {stops.map((stop, index) => {
        const expanded = expandedIds.has(stop.id);
        const selected = selectedId === stop.id;
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const travelledBefore = index <= progressIndex;
        const travelledAfter = index < progressIndex;
        const panelId = `stop-panel-${stop.id}`;
        const statusText = statusLabel(t, stop);

        return (
          <li
            key={stop.id}
            ref={(el) => {
              if (el) itemRefs.current.set(stop.id, el);
              else itemRefs.current.delete(stop.id);
            }}
            className="relative flex gap-3 ps-1"
          >
            {/* Rail: marker + continuous connector */}
            <div className="relative flex w-9 shrink-0 flex-col items-center" aria-hidden>
              <span
                className={cn(
                  'w-[3px] flex-none rounded-full',
                  isFirst ? 'h-3 bg-transparent' : 'h-3',
                  !isFirst && (travelledBefore ? 'bg-cta' : 'bg-[repeating-linear-gradient(to_bottom,var(--primary)_0_5px,transparent_5px_10px)] opacity-60'),
                )}
              />
              <RouteMarkerVisual kind={stop.kind} status={stop.status} number={stop.number} size="md" selected={selected} />
              <span
                className={cn(
                  'w-[3px] flex-1 rounded-full',
                  isLast ? 'bg-transparent' : travelledAfter ? 'bg-cta' : 'bg-[repeating-linear-gradient(to_bottom,var(--primary)_0_5px,transparent_5px_10px)] opacity-60',
                )}
              />
            </div>

            <div
              className={cn(
                'mb-3 min-w-0 flex-1 rounded-lg border transition-[border-color,background-color,box-shadow]',
                selected ? 'border-primary/50 bg-selection shadow-sm' : 'border-transparent',
                stop.status === 'current' && !selected && 'border-accent-pink/35 bg-pink-tint/40',
                stop.status === 'overdue' && !selected && 'border-warning/40 bg-warning-tint/50',
                stop.kind === 'break' && !selected && stop.status === 'upcoming' && 'border-accent-pink/25 border-dashed',
              )}
            >
              <button
                ref={(el) => {
                  if (el) headerRefs.current.set(stop.id, el);
                  else headerRefs.current.delete(stop.id);
                }}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                  onSelect(stop.id);
                  onToggleExpanded(stop.id);
                }}
                className="focus-ring flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-start"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-fg-muted flex flex-wrap items-center gap-x-2 text-xs font-medium tabular-nums">
                    <span dir="ltr">
                      {stop.durationMin > 0 ? `${stop.plannedTime}–${stop.plannedEnd}` : stop.plannedTime}
                    </span>
                    {stop.durationMin > 0 && <span>· {formatDuration(t, stop.durationMin)}</span>}
                  </span>
                  <span className={cn('text-[0.9375rem] leading-snug font-bold', stop.status === 'completed' ? 'text-fg-secondary' : 'text-fg')}>
                    {stop.number !== undefined && <span className="sr-only">{t('timeline.stopNumber', { n: stop.number })} </span>}
                    {stop.name}
                  </span>
                  <span className="type-caption text-fg-muted truncate">{stop.area}</span>
                  {statusText && <StatusBadge stop={stop} text={statusText} />}
                </span>
                <ChevronDown
                  className={cn('text-fg-muted mt-1 size-5 shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
                  aria-hidden
                />
              </button>

              {expanded && (
                <div id={panelId} className="flex flex-col gap-3 px-3 pb-3">
                  {stop.status === 'overdue' && (
                    <p className="text-warning-fg flex items-start gap-2 text-sm">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {t('timeline.overdueExplain', { time: stop.plannedEnd })}
                    </p>
                  )}
                  <p className="type-body text-fg-secondary" dir="auto">
                    {stop.description}
                  </p>
                  {stop.tips.length > 0 && (
                    <div className="bg-surface-muted flex flex-col gap-1.5 rounded-md p-3">
                      <p className="flex items-center gap-1.5 text-sm font-bold">
                        <Lightbulb className="text-warning-fg size-4" aria-hidden />
                        {t('timeline.tips')}
                      </p>
                      <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal" dir="auto">
                        {stop.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {stop.kind !== 'start' && (
                      <Button size="sm" variant={stop.completed ? 'secondary' : 'primary'} onClick={() => onToggleCompleted(stop.id)} aria-pressed={stop.completed}>
                        {stop.completed ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
                        {stop.completed ? t('actions.undoComplete') : t('actions.complete')}
                      </Button>
                    )}
                    {!stop.completed && stop.status !== 'current' && stop.kind !== 'start' && (
                      <Button size="sm" variant="secondary" onClick={() => onSetCurrent(stop.id)}>
                        <Crosshair aria-hidden />
                        {t('actions.setCurrent')}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onSelect(stop.id)}>
                      <MapPin aria-hidden />
                      {t('actions.showOnMap')}
                    </Button>
                    {canRemove(stop) && (
                      <Button size="sm" variant="ghost" className="text-error-fg hover:bg-error-tint" onClick={() => onRemove(stop.id)}>
                        <Trash aria-hidden />
                        {t('actions.remove')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function statusLabel(t: ReturnType<typeof useTranslations<'trip'>>, stop: DerivedStop): string | null {
  if (stop.kind === 'start') return stop.completed ? t('status.departed') : t('status.start');
  if (stop.kind === 'destination' && stop.status === 'upcoming') return t('status.destination');
  if (stop.status === 'current') return t('status.current');
  if (stop.status === 'overdue') return t('status.overdue');
  if (stop.status === 'completed') return t('status.completed');
  if (stop.kind === 'break') return t('status.break');
  return null;
}

function StatusBadge({ stop, text }: { stop: DerivedStop; text: string }) {
  const tone =
    stop.status === 'current'
      ? 'pink'
      : stop.status === 'overdue'
        ? 'warning'
        : stop.status === 'completed'
          ? 'success'
          : stop.kind === 'start'
            ? 'success'
            : stop.kind === 'break'
              ? 'pink'
              : 'neutral';
  return (
    <Badge tone={tone} className={cn('mt-0.5', stop.status === 'current' && 'font-bold')}>
      {stop.status === 'current' && <span className="bg-accent-pink size-1.5 rounded-full motion-safe:animate-pulse" />}
      {text}
    </Badge>
  );
}
