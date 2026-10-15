import { describe, expect, it } from 'vitest';
import { DEMO_BOOTHS } from '@/entities/expo/api/demo/expo';
import { DEMO_PLACES } from '@/entities/place/api/demo/places';
import type { Plan } from '@/entities/plan';
import { boothAlternatives, placeAlternatives, planRefIds, replaceStopInputs } from './replace-stop';

const place = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;

const plan: Plan = {
  id: 'plan_test',
  ownerId: 'usr_demo',
  name: 'Test',
  type: 'tourism',
  isDraft: false,
  startedAt: null,
  end: { kind: 'place', placeId: 'plc_bujairi' },
  stops: [
    { id: 'stop_a', order: 0, ref: { kind: 'place', placeId: 'plc_masmak' }, durationMin: 60, completedAt: '2026-10-12T06:00:00.000Z' },
    { id: 'stop_b', order: 1, ref: { kind: 'place', placeId: 'plc_murabba' }, durationMin: 45, startTime: '11:00' },
    { id: 'stop_c', order: 2, ref: { kind: 'place', placeId: 'plc_turaif' }, durationMin: 120 },
  ],
  createdAt: '2026-10-10T10:00:00.000Z',
  updatedAt: '2026-10-10T10:00:00.000Z',
} as Plan;

describe('replace a stop (demo alternatives from the guide data)', () => {
  it('never offers places already in the plan (stops or end point)', () => {
    const ids = planRefIds(plan);
    const alternatives = placeAlternatives(place('plc_murabba'), DEMO_PLACES, ids);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.length).toBeLessThanOrEqual(4);
    for (const a of alternatives) expect(ids.has(a.id)).toBe(false);
  });

  it('ranks the same category first', () => {
    const [first] = placeAlternatives(place('plc_murabba'), DEMO_PLACES, planRefIds(plan));
    expect(first?.reasons).toContain('sameCategory');
  });

  it('Expo alternatives are booths only', () => {
    const current = DEMO_BOOTHS.find((b) => b.id === 'booth_main_stage')!;
    const alternatives = boothAlternatives(current, DEMO_BOOTHS, new Set());
    expect(alternatives.every((a) => a.ref.kind === 'booth')).toBe(true);
  });

  it('swaps only the chosen stop and keeps the others (ids, order, completion)', () => {
    const next = replaceStopInputs(plan, 'stop_b', { ref: { kind: 'place', placeId: 'plc_national_museum' }, durationMin: 90 });
    expect(next.map((s) => s.id)).toEqual(['stop_a', undefined, 'stop_c']);
    expect(next[0]?.completedAt).toBe('2026-10-12T06:00:00.000Z');
    expect(next[1]).toMatchObject({ ref: { kind: 'place', placeId: 'plc_national_museum' }, durationMin: 90, startTime: '11:00', completedAt: null });
  });
});
