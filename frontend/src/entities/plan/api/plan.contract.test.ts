import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeaturedPlanSchema, planProgress, PlanSchema, planStatus, sortedStops, type ProposalToSave } from '../model/plan';
import { DEMO_FEATURED_PLANS, seedPlans } from './demo/plans';
import { mockPlanRepository, planStore, queryPlans } from './plan.mock';

/** Runs a demo call to completion under fake timers. */
async function run<T>(promise: Promise<T>): Promise<T> {
  const settled = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.runAllTimersAsync();
  const result = await settled;
  if ('error' in result) throw result.error;
  return result.value;
}

describe('demo plans data', () => {
  it('matches the Plan contracts', () => {
    for (const plan of seedPlans()) expect(PlanSchema.safeParse(plan).success, plan.id).toBe(true);
    for (const plan of DEMO_FEATURED_PLANS) expect(FeaturedPlanSchema.safeParse(plan).success, plan.id).toBe(true);
  });

  it('covers every status, with one plan 2 of 5 in progress and two Expo plans', () => {
    const plans = seedPlans();
    expect(new Set(plans.map(planStatus))).toEqual(new Set(['draft', 'upcoming', 'in_progress', 'completed']));
    const inProgress = plans.find((p) => planStatus(p) === 'in_progress')!;
    // 5 stops + the lunch break + the end point (Al-Bujairi)
    expect(planProgress(inProgress)).toMatchObject({ completed: 2, total: 7 });
    expect(plans.filter((p) => p.type === 'expo')).toHaveLength(2);
  });

  it('the Riyadh and Expo examples run today with a lunch break after a stop that is running late (P-028)', () => {
    const plans = seedPlans();
    for (const id of ['plan_heritage_day', 'plan_expo_ai']) {
      const plan = plans.find((p) => p.id === id)!;
      expect(plan.breaks, id).toHaveLength(1);
      const lunch = plan.breaks![0]!;
      expect(plan.stops.some((s) => s.id === lunch.afterStopId), id).toBe(true);
      expect(lunch.label.en).toMatch(/Lunch break/);
      expect(lunch.label.ar).toMatch(/استراحة غداء/);
      // The stop before lunch is not done and ended before the break starts (late from the break's start)
      const before = plan.stops.find((s) => s.id === lunch.afterStopId)!;
      expect(before.completedAt ?? null).toBeNull();
      expect(planStatus(plan)).toBe('in_progress');
    }
  });

  it('gives the in-progress demo plan a verified start point and an end point', () => {
    const plan = seedPlans().find((p) => p.id === 'plan_heritage_day')!;
    expect(plan.start).toMatchObject({ kind: 'point', locationSource: expect.stringMatching(/^osm:(node|way|relation)\/\d+/) });
    expect(plan.end).toEqual({ kind: 'place', placeId: 'plc_bujairi' });
  });
});

describe('plan selectors', () => {
  it('derives status from drafts, start and manual completion', () => {
    const base = seedPlans().find((p) => p.id === 'plan_modern_evening')!;
    expect(planStatus(base)).toBe('upcoming');
    expect(planStatus({ ...base, startedAt: new Date().toISOString() })).toBe('in_progress');
    expect(planStatus({ ...base, stops: base.stops.map((s) => ({ ...s, completedAt: new Date().toISOString() })) })).toBe('completed');
    expect(planStatus({ ...base, isDraft: true })).toBe('draft');
  });

  it('filters by tab and searches names', () => {
    const plans = seedPlans();
    expect(queryPlans(plans, { tab: 'drafts' }).every((p) => p.isDraft)).toBe(true);
    expect(queryPlans(plans, { tab: 'completed' }).map((p) => p.id)).toEqual(['plan_diriyah_done']);
    expect(queryPlans(plans, { q: 'expo' }).map((p) => p.id)).toEqual(['plan_expo_ai']);
  });
});

describe('mockPlanRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    planStore.reset();
  });
  afterEach(() => vi.useRealTimers());

  const proposal: ProposalToSave = {
    proposalId: 'prop_test',
    name: 'Test day',
    type: 'tourism',
    startTime: '09:00',
    stops: [
      { ref: { kind: 'place', placeId: 'plc_masmak' }, durationMin: 60 },
      { ref: { kind: 'place', placeId: 'plc_souq_zal' }, durationMin: 45 },
    ],
  };

  it('saves a proposal idempotently (D-021)', async () => {
    const first = await run(mockPlanRepository.createFromProposal(proposal));
    const second = await run(mockPlanRepository.createFromProposal(proposal));
    expect(second.id).toBe(first.id);
    expect(planStore.get().filter((p) => p.sourceProposalId === 'prop_test')).toHaveLength(1);
    expect(first.stops.map((s) => s.order)).toEqual([0, 1]);
  });

  it('replaces demo plans saved in the previous shape (version bump)', () => {
    window.localStorage.setItem('morshid:v1:plans', '[]');
    planStore.reset();
    planStore.get();
    expect(window.localStorage.getItem('morshid:v1:plans')).toBeNull();
  });

  it('persists changes to localStorage', async () => {
    await run(mockPlanRepository.update('plan_modern_evening', { name: 'Renamed' }));
    expect(window.localStorage.getItem('morshid:v1:plans-v3')).toContain('Renamed');
  });

  it('adds, removes and reorders stops, keeping order contiguous', async () => {
    let plan = await run(mockPlanRepository.addStop('plan_modern_evening', { ref: { kind: 'place', placeId: 'plc_masmak' }, durationMin: 30 }));
    expect(sortedStops(plan).map((s) => s.order)).toEqual([0, 1, 2, 3]);

    const ids = sortedStops(plan).map((s) => s.id);
    plan = await run(mockPlanRepository.reorderStops(plan.id, [...ids].reverse()));
    expect(sortedStops(plan).map((s) => s.id)).toEqual([...ids].reverse());

    plan = await run(mockPlanRepository.removeStop(plan.id, ids[0]!));
    expect(sortedStops(plan).map((s) => s.order)).toEqual([0, 1, 2]);

    await expect(run(mockPlanRepository.reorderStops(plan.id, [ids[1]!]))).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('completes stops manually and starts the plan', async () => {
    const plan = await run(mockPlanRepository.setStopCompleted('plan_modern_evening', 'stop_modern_evening_1', true));
    expect(plan.stops.find((s) => s.id === 'stop_modern_evening_1')?.completedAt).toBeTruthy();
    expect(planStatus(plan)).toBe('in_progress');
    const undone = await run(mockPlanRepository.setStopCompleted(plan.id, 'stop_modern_evening_1', false));
    expect(undone.stops.find((s) => s.id === 'stop_modern_evening_1')?.completedAt).toBeNull();
  });

  it('refuses to start drafts and reports unknown plans', async () => {
    await expect(run(mockPlanRepository.start('plan_weekend_draft'))).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(run(mockPlanRepository.get('plan_nope'))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('copies a featured plan as a localized draft', async () => {
    const copy = await run(mockPlanRepository.copyFeatured('feat_heritage_day', 'ar'));
    expect(copy.name).toBe('يوم في تراث الرياض');
    expect(copy.isDraft).toBe(true);
    expect(copy.stops.every((s) => !s.completedAt)).toBe(true);
    expect(PlanSchema.safeParse(copy).success).toBe(true);
  });
});

describe('editing a whole plan (editor Save)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    planStore.reset();
  });
  afterEach(() => vi.useRealTimers());

  it('replaces the stop list, keeping ids and completion of existing stops', async () => {
    const before = await run(mockPlanRepository.get('plan_heritage_day'));
    const [first, second, ...rest] = sortedStops(before);
    const updated = await run(
      mockPlanRepository.update('plan_heritage_day', {
        stops: [{ ...second! }, { ...first! }, ...rest.map((s) => ({ ...s })), { ref: { kind: 'place', placeId: 'plc_kafd' }, durationMin: 45 }],
      }),
    );
    const stops = sortedStops(updated);
    expect(stops.map((s) => s.order)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(stops[0]!.id).toBe(second!.id);
    expect(stops[1]!.completedAt).toBe(first!.completedAt); // completion kept
    expect(stops.at(-1)!.id).toMatch(/^stop_/);
    expect(stops.at(-1)!.completedAt).toBeNull();
  });

  it('rejects stops that do not match the plan type', async () => {
    await expect(run(mockPlanRepository.update('plan_modern_evening', { stops: [{ ref: { kind: 'booth', boothId: 'booth_space_lab' }, durationMin: 30 }] }))).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    await expect(run(mockPlanRepository.create({ name: 'x', type: 'expo', isDraft: true, stops: [{ ref: { kind: 'place', placeId: 'plc_masmak' }, durationMin: 30 }] }))).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });

  it('completes the end point like a stop', async () => {
    const plan = await run(mockPlanRepository.setStopCompleted('plan_heritage_day', 'end', true));
    expect(plan.endCompletedAt).toBeTruthy();
    expect(planProgress(plan)).toMatchObject({ completed: 3, total: 7 });
  });
});
