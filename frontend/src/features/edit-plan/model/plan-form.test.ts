import { describe, expect, it } from 'vitest';
import { seedPlans } from '@/entities/plan/api/demo/plans';
import { canFinalize, EMPTY_FORM, formToPlanInput, hasRef, PlanFormSchema, planToForm } from './plan-form';

const masmak = { kind: 'place' as const, placeId: 'plc_masmak' };
const booth = { kind: 'booth' as const, boothId: 'booth_ai_experience' };
const issues = (values: unknown) => {
  const r = PlanFormSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('plan form validation', () => {
  it('accepts a minimal valid plan', () => {
    expect(issues({ ...EMPTY_FORM, name: 'Day out', stops: [{ ref: masmak, durationMin: 60, startTime: '' }] })).toEqual([]);
  });

  it('requires a name of at most 80 characters', () => {
    expect(issues({ ...EMPTY_FORM, name: '   ' })).toContain('nameRequired');
    expect(issues({ ...EMPTY_FORM, name: 'x'.repeat(81) })).toContain('nameTooLong');
  });

  it('validates dates, times and durations', () => {
    expect(issues({ ...EMPTY_FORM, name: 'a', date: '12/10/2026' })).toContain('dateInvalid');
    expect(issues({ ...EMPTY_FORM, name: 'a', startTime: '25:00' })).toContain('timeInvalid');
    expect(issues({ ...EMPTY_FORM, name: 'a', stops: [{ ref: masmak, durationMin: 2, startTime: '' }] })).toContain('durationMin');
    expect(issues({ ...EMPTY_FORM, name: 'a', stops: [{ ref: masmak, durationMin: 60, startTime: '9am' }] })).toContain('timeInvalid');
  });

  it('never mixes tourism places and Expo booths', () => {
    expect(issues({ ...EMPTY_FORM, name: 'a', type: 'tourism', stops: [{ ref: booth, durationMin: 30, startTime: '' }] })).toContain('mixedTypes');
    expect(issues({ ...EMPTY_FORM, name: 'a', type: 'expo', stops: [{ ref: booth, durationMin: 30, startTime: '' }] })).toEqual([]);
  });

  it('needs a stop to save (drafts may be empty) and detects duplicates', () => {
    expect(canFinalize({ stops: [] })).toBe(false);
    expect(canFinalize({ stops: [{ ref: masmak, durationMin: 60, startTime: '' }] })).toBe(true);
    expect(hasRef([{ ref: masmak }], { kind: 'place', placeId: 'plc_masmak' })).toBe(true);
    expect(hasRef([{ ref: masmak }], booth)).toBe(false);
  });
});

describe('plan ↔ form', () => {
  it('round-trips a saved plan, keeping stop ids and completion', () => {
    const plan = seedPlans().find((p) => p.id === 'plan_heritage_day')!;
    const form = planToForm(plan);
    expect(form.stops.map((s) => s.stopId)).toEqual([...plan.stops].sort((a, b) => a.order - b.order).map((s) => s.id));
    const input = formToPlanInput(form, false);
    expect(input.stops[0]).toMatchObject({ id: 'stop_heritage_day_1', completedAt: expect.any(String) });
    expect(input).toMatchObject({ name: plan.name, type: 'tourism', isDraft: false });
  });

  it('turns empty optional fields into undefined', () => {
    const input = formToPlanInput({ ...EMPTY_FORM, name: ' Trip ', date: '', startTime: '' }, true);
    expect(input).toMatchObject({ name: 'Trip', date: undefined, startTime: undefined, isDraft: true });
  });
});
