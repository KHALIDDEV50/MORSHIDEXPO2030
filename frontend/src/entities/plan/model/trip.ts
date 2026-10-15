/**
 * Trip / itinerary model for the trip-details panel (P-010).
 * Pure functions: the same derivation feeds the timeline, the map markers and the progress
 * summary, so they can never disagree (D-019 "one source of truth").
 */
export type TripStopKind = 'start' | 'visit' | 'break' | 'destination';
export type TripStopStatus = 'upcoming' | 'current' | 'completed' | 'overdue';

export type TripStop = {
  id: string;
  kind: TripStopKind;
  /** Planned arrival, "HH:mm" (local plan time) */
  plannedTime: string;
  durationMin: number;
  /** Marked done by the user — never inferred from location (D-019) */
  completed: boolean;
  /** Illustrative map position in percent (Phase 5 replaces this with verified coordinates) */
  position: { x: number; y: number };
};

export type DerivedStop<S extends TripStop = TripStop> = S & {
  status: TripStopStatus;
  /** 1-based sequence among visit stops (start/break/destination are not numbered) */
  number?: number;
  /** Planned end, "HH:mm" */
  plannedEnd: string;
};

export type TripProgress = {
  /** Stops that count toward progress (everything except the start point) */
  total: number;
  completed: number;
  remaining: number;
  /** 0..1, from manually completed stops only */
  ratio: number;
  overdue: number;
  firstTime?: string;
  lastEnd?: string;
  /** Sum of planned visit/break durations, minutes */
  plannedMinutes: number;
};

export function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/**
 * Status precedence: completed → current (user-selected) → overdue (planned end has passed,
 * not completed) → upcoming. `now` is "HH:mm" on the plan day; pass null when the plan is not today.
 */
export function deriveStops<S extends TripStop>(
  stops: S[],
  { currentId, now }: { currentId: string | null; now: string | null },
): DerivedStop<S>[] {
  const nowMin = now ? toMinutes(now) : null;
  let visitNumber = 0;
  return stops.map((stop) => {
    const plannedEndMin = toMinutes(stop.plannedTime) + stop.durationMin;
    let status: TripStopStatus = 'upcoming';
    if (stop.completed) status = 'completed';
    else if (stop.id === currentId) status = 'current';
    else if (nowMin !== null && stop.kind !== 'start' && plannedEndMin < nowMin) status = 'overdue';
    const number = stop.kind === 'visit' ? ++visitNumber : undefined;
    return { ...stop, status, number, plannedEnd: fromMinutes(plannedEndMin) };
  });
}

export function computeProgress(stops: DerivedStop[]): TripProgress {
  const counted = stops.filter((s) => s.kind !== 'start');
  const completed = counted.filter((s) => s.completed).length;
  const total = counted.length;
  return {
    total,
    completed,
    remaining: total - completed,
    ratio: total === 0 ? 0 : completed / total,
    overdue: stops.filter((s) => s.status === 'overdue').length,
    firstTime: stops[0]?.plannedTime,
    lastEnd: stops.at(-1)?.plannedEnd,
    plannedMinutes: counted.reduce((sum, s) => sum + s.durationMin, 0),
  };
}

/** Next stop the visitor should go to: the current one, else the first not completed (excluding start). */
export function nextStopId(stops: DerivedStop[]): string | null {
  return (
    stops.find((s) => s.status === 'current')?.id ??
    stops.find((s) => s.kind !== 'start' && !s.completed)?.id ??
    null
  );
}

// ───────────── Commands (immutable) ─────────────

export function toggleCompleted<S extends TripStop>(stops: S[], id: string): S[] {
  return stops.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s));
}

/** Start and destination anchor the route and cannot be removed. */
export function canRemove(stop: TripStop): boolean {
  return stop.kind === 'visit' || stop.kind === 'break';
}

export function removeStop<S extends TripStop>(stops: S[], id: string): S[] {
  const target = stops.find((s) => s.id === id);
  if (!target || !canRemove(target)) return stops;
  return stops.filter((s) => s.id !== id);
}

/** Re-insert a removed stop at its previous index (undo). */
export function restoreStop<S extends TripStop>(stops: S[], stop: S, index: number): S[] {
  const next = [...stops];
  next.splice(Math.min(index, next.length), 0, stop);
  return next;
}
