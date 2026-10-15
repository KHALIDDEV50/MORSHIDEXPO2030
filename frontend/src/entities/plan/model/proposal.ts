/**
 * AI itinerary proposal model (D-021: a proposal until the user explicitly saves it).
 * Pure functions: editing (remove / reorder) re-derives numbering, times and the summary,
 * so the step list, connectors, summary and route markers always agree.
 */
import { fromMinutes, toMinutes, type TripStopKind } from './trip';

export type ProposalPriority = 'high' | 'recommended' | 'optional';

export type ProposalStop = {
  id: string;
  kind: TripStopKind;
  durationMin: number;
  priority?: ProposalPriority;
  /** Illustrative map position in percent (verified coordinates replace this in Phase 5) */
  position: { x: number; y: number };
};

export type ScheduledProposalStop<S extends ProposalStop = ProposalStop> = S & {
  /** 1-based number among visit stops */
  number?: number;
  plannedTime: string;
  plannedEnd: string;
};

export type ProposalSummary = {
  /** Visit stops (what users count as "stops") */
  visits: number;
  breaks: number;
  startTime: string;
  endTime: string;
  totalMinutes: number;
};

/**
 * Lays stops out from `startTime`, adding an estimated `bufferMin` between consecutive stops.
 * Times are estimates — never travel-time claims (D-018/D-020).
 */
export function scheduleProposal<S extends ProposalStop>(
  stops: S[],
  { startTime, bufferMin }: { startTime: string; bufferMin: number },
): ScheduledProposalStop<S>[] {
  let cursor = toMinutes(startTime);
  let visit = 0;
  return stops.map((stop, index) => {
    if (index > 0) cursor += bufferMin;
    const start = cursor;
    cursor += stop.durationMin;
    return {
      ...stop,
      number: stop.kind === 'visit' ? ++visit : undefined,
      plannedTime: fromMinutes(start),
      plannedEnd: fromMinutes(cursor),
    };
  });
}

export function summarizeProposal(stops: ScheduledProposalStop[]): ProposalSummary {
  const first = stops[0];
  const last = stops.at(-1);
  const startTime = first?.plannedTime ?? '00:00';
  const endTime = last?.plannedEnd ?? startTime;
  return {
    visits: stops.filter((s) => s.kind === 'visit').length,
    breaks: stops.filter((s) => s.kind === 'break').length,
    startTime,
    endTime,
    totalMinutes: Math.max(0, toMinutes(endTime) - toMinutes(startTime)),
  };
}

/** Visits and breaks can be removed/reordered; start and destination anchor the trip. */
export function isMovable(stop: ProposalStop): boolean {
  return stop.kind === 'visit' || stop.kind === 'break';
}

export function hasEditableStops(stops: ProposalStop[]): boolean {
  return stops.some(isMovable);
}

/** Move a stop one step up (-1) or down (+1) without crossing the start or destination. */
export function moveProposalStop<S extends ProposalStop>(stops: S[], id: string, direction: -1 | 1): S[] {
  const index = stops.findIndex((s) => s.id === id);
  const target = index + direction;
  const stop = stops[index];
  const other = stops[target];
  if (!stop || !other || !isMovable(stop) || !isMovable(other)) return stops;
  const next = [...stops];
  next[index] = other;
  next[target] = stop;
  return next;
}

export function canMove(stops: ProposalStop[], id: string, direction: -1 | 1): boolean {
  const index = stops.findIndex((s) => s.id === id);
  const stop = stops[index];
  const other = stops[index + direction];
  return Boolean(stop && other && isMovable(stop) && isMovable(other));
}

export function removeProposalStop<S extends ProposalStop>(stops: S[], id: string): S[] {
  const stop = stops.find((s) => s.id === id);
  if (!stop || !isMovable(stop)) return stops;
  return stops.filter((s) => s.id !== id);
}
