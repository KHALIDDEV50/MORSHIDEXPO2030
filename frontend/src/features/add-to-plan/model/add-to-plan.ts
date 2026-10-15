import { planStatus, type Plan, type PlanType } from '@/entities/plan';

/** Plans an item can be added to: unfinished plans of the SAME type (never mixed — D-012), newest first. */
export function addablePlans(plans: Plan[], type: PlanType = 'tourism'): Plan[] {
  return plans.filter((p) => p.type === type && planStatus(p) !== 'completed').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** True when the plan already has this place or booth (adding it twice is blocked). */
export function planHasPlace(plan: Plan, id: string): boolean {
  return plan.stops.some((s) => (s.ref.kind === 'place' ? s.ref.placeId : s.ref.boothId) === id);
}

export type AddTarget = { kind: 'existing'; planId: string } | { kind: 'new'; name: string };

/** First sensible default: the most recent matching plan without the item, else a new plan. */
export function defaultTarget(plans: Plan[], id: string, newName: string, canCreate: boolean, type: PlanType = 'tourism'): AddTarget | null {
  const plan = addablePlans(plans, type).find((p) => !planHasPlace(p, id));
  if (plan) return { kind: 'existing', planId: plan.id };
  return canCreate ? { kind: 'new', name: newName } : null;
}
