import { describe, expect, it } from 'vitest';
import { seedPlans } from '@/entities/plan/api/demo/plans';
import { addablePlans, defaultTarget, planHasPlace } from './add-to-plan';

const plans = seedPlans();

describe('add to plan rules', () => {
  it('offers unfinished tourism plans only, newest first', () => {
    const offered = addablePlans(plans);
    expect(offered.every((p) => p.type === 'tourism')).toBe(true);
    expect(offered.some((p) => p.id === 'plan_diriyah_done')).toBe(false); // completed
    expect(offered.map((p) => p.updatedAt)).toEqual([...offered.map((p) => p.updatedAt)].sort().reverse());
  });

  it('offers only Expo plans for an Expo pavilion — tourism and Expo are never mixed', () => {
    const expo = addablePlans(plans, 'expo');
    expect(expo.length).toBeGreaterThan(0);
    expect(expo.every((p) => p.type === 'expo')).toBe(true);
    expect(addablePlans(plans, 'tourism').every((p) => p.type === 'tourism')).toBe(true);
    expect(defaultTarget(plans, 'booth_green_energy', 'Visit', true, 'expo')).toMatchObject({ kind: 'existing' });
    const target = defaultTarget(plans, 'booth_green_energy', 'Visit', true, 'expo');
    expect(plans.find((p) => target?.kind === 'existing' && p.id === target.planId)?.type).toBe('expo');
  });

  it('detects booths already in a plan', () => {
    expect(planHasPlace(plans.find((p) => p.id === 'plan_expo_ai')!, 'booth_ai_experience')).toBe(true);
  });

  it('detects places already in a plan', () => {
    const heritage = plans.find((p) => p.id === 'plan_heritage_day')!;
    expect(planHasPlace(heritage, 'plc_masmak')).toBe(true);
    expect(planHasPlace(heritage, 'plc_kafd')).toBe(false);
  });

  it('defaults to the newest plan without the place, else a new plan (if allowed)', () => {
    const target = defaultTarget(plans, 'plc_kafd', 'Visit', true);
    expect(target?.kind).toBe('existing');
    // A place that is in every addable plan → new plan when allowed, nothing when not
    const onlyHeritage = plans.filter((p) => p.id === 'plan_heritage_day');
    expect(defaultTarget(onlyHeritage, 'plc_masmak', 'Visit to Masmak', true)).toEqual({ kind: 'new', name: 'Visit to Masmak' });
    expect(defaultTarget(onlyHeritage, 'plc_masmak', 'Visit to Masmak', false)).toBeNull();
  });
});
