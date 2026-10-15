'use client';

import { ArrowDown, ArrowUp, ChevronDown, Landmark, Lightbulb, MessageCircle, Trash, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import { Badge, Button, PriorityBadge, RouteMarkerVisual } from '@/shared/ui';
import { canMove, isMovable, type ProposalStop, type ScheduledProposalStop } from '../model/proposal';
import { formatDuration } from './trip-progress';

export type ProposalStopContent = ProposalStop & {
  name: string;
  area: string;
  /** One line for the compact list */
  summary: string;
  /** Cultural / historical context shown when expanded */
  context: string;
  tips: string[];
};

type Props = {
  stops: ScheduledProposalStop<ProposalStopContent>[];
  expandedIds: ReadonlySet<string>;
  editing: boolean;
  onToggleExpanded: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAsk?: (id: string) => void;
};

const dashed = 'bg-[repeating-linear-gradient(to_bottom,var(--primary)_0_5px,transparent_5px_10px)] opacity-50';

/**
 * Proposal itinerary steps: compact, scannable rows on a connected rail (same markers and
 * connector style as the trip timeline). Rows expand for context, tips and actions; edit mode
 * adds reorder/remove controls. Start and destination are fixed anchors.
 */
export function ProposalSteps({ stops, expandedIds, editing, onToggleExpanded, onMove, onRemove, onAsk }: Props) {
  const t = useTranslations('proposal');
  const tt = useTranslations('trip');

  return (
    <ol className="flex flex-col" aria-label={t('stepsLabel')}>
      {stops.map((stop, index) => {
        const expanded = expandedIds.has(stop.id);
        const movable = isMovable(stop);
        const panelId = `proposal-step-${stop.id}`;
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const kindLabel =
          stop.kind === 'start' ? tt('status.start') : stop.kind === 'destination' ? tt('status.destination') : stop.kind === 'break' ? tt('status.break') : null;

        return (
          <li key={stop.id} className="relative flex gap-3">
            <div className="relative flex w-9 shrink-0 flex-col items-center" aria-hidden>
              <span className={cn('h-3 w-[3px] flex-none rounded-full', isFirst ? 'bg-transparent' : dashed)} />
              <RouteMarkerVisual kind={stop.kind} status="upcoming" number={stop.number} size="md" />
              <span className={cn('w-[3px] flex-1 rounded-full', isLast ? 'bg-transparent' : dashed)} />
            </div>

            <div
              className={cn(
                'mb-2.5 min-w-0 flex-1 rounded-lg border transition-[border-color,background-color]',
                expanded ? 'border-border bg-surface shadow-sm' : 'border-transparent',
                stop.kind === 'break' && !expanded && 'border-accent-pink/25 bg-pink-tint/30 border-dashed',
              )}
            >
              <div className="flex items-start gap-1">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => onToggleExpanded(stop.id)}
                  className="focus-ring hover:bg-surface-muted/60 flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg p-2.5 text-start"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-fg-muted flex flex-wrap items-center gap-x-1.5 text-xs font-medium tabular-nums">
                      <span dir="ltr">{stop.durationMin > 0 ? `${stop.plannedTime}–${stop.plannedEnd}` : stop.plannedTime}</span>
                      {stop.durationMin > 0 && <span>· {formatDuration(tt, stop.durationMin)}</span>}
                    </span>
                    <span className="text-fg flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] leading-snug font-bold">
                      {stop.number !== undefined && <span className="sr-only">{tt('timeline.stopNumber', { n: stop.number })}</span>}
                      {stop.name}
                      {stop.priority && <PriorityBadge level={stop.priority} className="font-medium" />}
                      {kindLabel && <Badge tone={stop.kind === 'break' ? 'pink' : stop.kind === 'start' ? 'success' : 'neutral'}>{kindLabel}</Badge>}
                    </span>
                    <span className={cn('type-body-sm text-fg-secondary font-normal', !expanded && 'line-clamp-1')} dir="auto">
                      {stop.summary}
                    </span>
                  </span>
                  <ChevronDown className={cn('text-fg-muted mt-1 size-5 shrink-0 transition-transform duration-200', expanded && 'rotate-180')} aria-hidden />
                </button>

                {editing && movable && (
                  <div className="flex shrink-0 items-center gap-0.5 pe-1 pt-2" role="group" aria-label={t('editControls', { name: stop.name })}>
                    <button type="button" onClick={() => onMove(stop.id, -1)} disabled={!canMove(stops, stop.id, -1)} aria-label={t('moveUp', { name: stop.name })} title={t('moveUp', { name: stop.name })} className="focus-ring text-fg-secondary hover:bg-surface-muted grid size-9 cursor-pointer place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-30">
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => onMove(stop.id, 1)} disabled={!canMove(stops, stop.id, 1)} aria-label={t('moveDown', { name: stop.name })} title={t('moveDown', { name: stop.name })} className="focus-ring text-fg-secondary hover:bg-surface-muted grid size-9 cursor-pointer place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-30">
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => onRemove(stop.id)} aria-label={t('removeNamed', { name: stop.name })} title={t('removeNamed', { name: stop.name })} className="focus-ring text-error-fg hover:bg-error-tint grid size-9 cursor-pointer place-items-center rounded-full">
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </div>

              {expanded && (
                <div id={panelId} className="flex flex-col gap-3 px-3 pb-3">
                  <p className="type-caption text-fg-muted">{stop.area}</p>
                  {stop.context && (
                    <div className="flex gap-2">
                      <Landmark className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                      <p className="type-body text-fg-secondary" dir="auto">
                        {stop.context}
                      </p>
                    </div>
                  )}
                  {stop.tips.length > 0 && (
                    <div className="bg-surface-muted flex flex-col gap-1.5 rounded-md p-3">
                      <p className="flex items-center gap-1.5 text-sm font-bold">
                        <Lightbulb className="text-warning-fg size-4" aria-hidden />
                        {tt('timeline.tips')}
                      </p>
                      <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal" dir="auto">
                        {stop.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {onAsk && stop.kind !== 'start' && (
                      <Button size="sm" variant="secondary" onClick={() => onAsk(stop.id)}>
                        <MessageCircle aria-hidden />
                        {t('askAbout')}
                      </Button>
                    )}
                    {movable && (
                      <Button size="sm" variant="ghost" className="text-error-fg hover:bg-error-tint" onClick={() => onRemove(stop.id)}>
                        <Trash aria-hidden />
                        {t('remove')}
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
