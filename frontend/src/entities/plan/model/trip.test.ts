import { describe, expect, it } from 'vitest';
import {
  canRemove,
  computeProgress,
  deriveStops,
  nextStopId,
  removeStop,
  restoreStop,
  toggleCompleted,
  type TripStop,
} from './trip';

const stop = (id: string, kind: TripStop['kind'], plannedTime: string, durationMin: number, completed = false): TripStop => ({
  id,
  kind,
  plannedTime,
  durationMin,
  completed,
  position: { x: 0, y: 0 },
});

const TRIP: TripStop[] = [
  stop('start', 'start', '08:45', 0, true),
  stop('masmak', 'visit', '09:00', 60, true),
  stop('murabba', 'visit', '10:15', 45),
  stop('lunch', 'break', '11:15', 60),
  stop('museum', 'visit', '12:30', 90),
  stop('end', 'destination', '14:15', 0),
];

describe('deriveStops', () => {
  it('numbers only visit stops, in order', () => {
    const d = deriveStops(TRIP, { currentId: null, now: null });
    expect(d.map((s) => s.number)).toEqual([undefined, 1, 2, undefined, 3, undefined]);
  });

  it('applies completed → current → overdue → upcoming precedence', () => {
    const d = deriveStops(TRIP, { currentId: 'lunch', now: '11:30' });
    const byId = Object.fromEntries(d.map((s) => [s.id, s.status]));
    expect(byId).toEqual({
      start: 'completed',
      masmak: 'completed',
      murabba: 'overdue', // ended 11:00, not completed
      lunch: 'current', // user-selected wins over overdue/upcoming
      museum: 'upcoming',
      end: 'upcoming',
    });
  });

  it('never marks anything overdue when the plan is not today', () => {
    const d = deriveStops(TRIP, { currentId: null, now: null });
    expect(d.some((s) => s.status === 'overdue')).toBe(false);
  });

  it('computes planned end times', () => {
    const d = deriveStops(TRIP, { currentId: null, now: null });
    expect(d.find((s) => s.id === 'museum')?.plannedEnd).toBe('14:00');
  });
});

describe('progress', () => {
  it('counts manually completed stops, excluding the start point', () => {
    const p = computeProgress(deriveStops(TRIP, { currentId: null, now: '11:30' }));
    expect(p).toMatchObject({ total: 5, completed: 1, remaining: 4, overdue: 1, plannedMinutes: 255 });
    expect(p.ratio).toBeCloseTo(0.2);
  });

  it('updates when a stop is completed or removed', () => {
    let trip = toggleCompleted(TRIP, 'murabba');
    expect(computeProgress(deriveStops(trip, { currentId: null, now: null })).completed).toBe(2);
    trip = removeStop(trip, 'museum');
    const derived = deriveStops(trip, { currentId: null, now: null });
    expect(computeProgress(derived).total).toBe(4);
    expect(derived.filter((s) => s.kind === 'visit').map((s) => s.number)).toEqual([1, 2]);
  });

  it('suggests the current stop, else the first unfinished one', () => {
    expect(nextStopId(deriveStops(TRIP, { currentId: null, now: null }))).toBe('murabba');
    expect(nextStopId(deriveStops(TRIP, { currentId: 'museum', now: null }))).toBe('museum');
  });
});

describe('remove / restore', () => {
  it('keeps the start and destination anchored', () => {
    expect(canRemove(TRIP[0]!)).toBe(false);
    expect(removeStop(TRIP, 'end')).toBe(TRIP);
    expect(canRemove(TRIP[3]!)).toBe(true);
  });

  it('restores a removed stop at its original position', () => {
    const removed = removeStop(TRIP, 'lunch');
    expect(restoreStop(removed, TRIP[3]!, 3).map((s) => s.id)).toEqual(TRIP.map((s) => s.id));
  });
});
