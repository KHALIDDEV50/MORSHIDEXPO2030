import { EXPIRY_WARNING_DAYS, GUEST_ENTITLEMENTS, LOW_CREDITS_RATIO, USAGE_COSTS, getPlan } from '../config/plans';
import type { CreditsBalance, Entitlements, PlanId, SubscriptionPlan, UsageAction, UserSubscription } from './types';

/**
 * Pure business rules — shared by the UI and the mock service so they can never disagree.
 * A production backend must re-validate all of this server-side.
 */

export function entitlementsFor(subscription: UserSubscription | null): Entitlements {
  if (!subscription) return GUEST_ENTITLEMENTS;
  if (subscription.status === 'expired') return getPlan('free').entitlements;
  return getPlan(subscription.planId).entitlements;
}

export function effectivePlanId(subscription: UserSubscription | null): PlanId | null {
  if (!subscription) return null;
  return subscription.status === 'expired' ? 'free' : subscription.planId;
}

export function creditCost(action: UsageAction): number {
  return USAGE_COSTS[action];
}

export type UsageCheck = { allowed: true; cost: number } | { allowed: false; cost: number; reason: 'out_of_credits' };

export function checkUsage(balance: CreditsBalance, action: UsageAction): UsageCheck {
  const cost = creditCost(action);
  if (cost === 0 || balance.remaining >= cost) return { allowed: true, cost };
  return { allowed: false, cost, reason: 'out_of_credits' };
}

export function applyUsage(balance: CreditsBalance, action: UsageAction): CreditsBalance {
  const check = checkUsage(balance, action);
  if (!check.allowed) return balance;
  return { ...balance, remaining: balance.remaining - check.cost };
}

export type CreditLevel = 'ok' | 'low' | 'empty';

export function creditLevel(balance: CreditsBalance): CreditLevel {
  if (balance.remaining <= 0) return 'empty';
  if (balance.allowance > 0 && balance.remaining / balance.allowance <= LOW_CREDITS_RATIO) return 'low';
  return 'ok';
}

export function usedRatio(balance: CreditsBalance): number {
  if (balance.allowance <= 0) return 1;
  return Math.min(1, Math.max(0, (balance.allowance - balance.remaining) / balance.allowance));
}

export function planChangeKind(current: PlanId | null, target: PlanId): 'upgrade' | 'downgrade' | 'same' | 'start' {
  if (current === null) return 'start';
  const a = getPlan(current).order;
  const b = getPlan(target).order;
  return b > a ? 'upgrade' : b < a ? 'downgrade' : 'same';
}

export function canSavePlan(subscription: UserSubscription | null, savedPlans: number): { allowed: boolean; reason?: 'sign_in_required' | 'limit_reached' } {
  if (!subscription) return { allowed: false, reason: 'sign_in_required' };
  const limit = entitlementsFor(subscription).savedPlans;
  if (limit !== null && savedPlans >= limit) return { allowed: false, reason: 'limit_reached' };
  return { allowed: true };
}

/** Next plan to suggest when a limit is reached (never suggests a downgrade). */
export function suggestedUpgrade(current: PlanId | null, plans: SubscriptionPlan[]): PlanId | null {
  const order = current ? getPlan(current).order : -1;
  return [...plans].sort((a, b) => a.order - b.order).find((p) => p.order > order && p.id !== 'free')?.id ?? null;
}

/**
 * Date the subscription will END (not renew): known when cancellation is scheduled, or for a
 * non-renewing active subscription. Null for auto-renewing, expired or guest.
 */
export function expiryDate(subscription: UserSubscription | null): string | null {
  if (!subscription || subscription.status === 'expired') return null;
  if (subscription.status === 'cancel_scheduled') return subscription.endsAt;
  if (subscription.status === 'active' && subscription.renewsAt === null) return subscription.endsAt;
  return null;
}

/** Whole calendar days from `now` (local date) until an ISO date (YYYY-MM-DD); 0 = ends today. */
export function daysUntil(isoDate: string, now: Date): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const end = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - today) / 86_400_000);
}

/** Days left to show in the header's expiry warning, or null when no warning applies (Gate D refinement). */
export function expiryWarningDays(subscription: UserSubscription | null, now: Date): number | null {
  const end = expiryDate(subscription);
  if (!end) return null;
  const days = daysUntil(end, now);
  return days >= 0 && days <= EXPIRY_WARNING_DAYS ? days : null;
}

/**
 * When moving to a new plan mid-period (demo rule): keep what was already used this period
 * and apply it against the new allowance.
 */
export function rebalanceForPlan(balance: CreditsBalance, newAllowance: number): CreditsBalance {
  const used = Math.max(0, balance.allowance - balance.remaining);
  return { ...balance, allowance: newAllowance, remaining: Math.max(0, newAllowance - used) };
}
