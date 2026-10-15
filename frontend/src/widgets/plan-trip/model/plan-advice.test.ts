import { describe, expect, it } from 'vitest';
import { DEMO_PLACES } from '@/entities/place/api/demo/places';
import { deriveStops, type Plan } from '@/entities/plan';
import { seedPlans as seedPlansForTests } from '@/entities/plan/api/demo/plans';
import { planAdvice } from './plan-advice';

const masmak = DEMO_PLACES.find((p) => p.id === 'plc_masmak')!;
const kafd = DEMO_PLACES.find((p) => p.id === 'plc_kafd')!;

describe('planAdvice', () => {
  it('flags drafts, long days, Expo and demo opening hours', () => {
    const plan: Plan = { ...seedPlansForTests()[0]!, isDraft: true };
    const items = deriveStops([
      { id: 's1', kind: 'visit', plannedTime: '08:30', durationMin: 300, completed: false, position: { x: 0, y: 0 }, name: 'Masmak', area: '', description: '', tips: [], repoStopId: 's1', mapPosition: null, resolved: { kind: 'place', place: masmak } as never },
      { id: 's2', kind: 'visit', plannedTime: '14:00', durationMin: 300, completed: false, position: { x: 0, y: 0 }, name: 'KAFD', area: '', description: '', tips: [], repoStopId: 's2', mapPosition: null, resolved: { kind: 'place', place: kafd } as never },
    ], { currentId: null, now: null });
    const keys = planAdvice({ ...plan, stops: [{ id: 's1', order: 0, ref: { kind: 'place', placeId: 'plc_masmak' }, durationMin: 300 }, { id: 's2', order: 1, ref: { kind: 'place', placeId: 'plc_kafd' }, durationMin: 300 }] }, items, 'en').map((a) => a.key);
    expect(keys).toContain('draft');
    expect(keys).toContain('longDay');
    expect(keys).toContain('hours'); // Masmak has (demo) hours
    expect(keys).toContain('midday'); // KAFD is outdoors at 14:00
    expect(planAdvice({ ...plan, type: 'expo', stops: [] }, [], 'en').map((a) => a.key)).toContain('expo');
  });
});
