import type { BillingInterval, Entitlements, PlanId, SubscriptionPlan, UsageAction } from '../model/types';

/**
 * PROPOSED plan configuration (P-012) — edit here, not in components.
 * Credit allowances are initial proposals; prices are intentionally `null` (not set / to be confirmed).
 * Guest allowance follows D-024 (10 demo credits, no saving).
 */
export const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    order: 0,
    prices: { monthly: { amount: 0, currency: 'SAR' }, annual: { amount: 0, currency: 'SAR' } },
    entitlements: {
      monthlyCredits: 30,
      proposalsPerMonth: 5,
      savedPlans: 3,
      customization: 'basic',
      personalization: false,
      enhancedRecommendations: false,
      priorityResponses: 'not_included',
    },
  },
  {
    id: 'plus',
    order: 1,
    recommended: true,
    prices: { monthly: null, annual: null },
    entitlements: {
      monthlyCredits: 300,
      proposalsPerMonth: 40,
      savedPlans: 25,
      customization: 'extended',
      personalization: true,
      enhancedRecommendations: true,
      priorityResponses: 'not_included',
    },
  },
  {
    id: 'premium',
    order: 2,
    prices: { monthly: null, annual: null },
    entitlements: {
      monthlyCredits: 1000,
      proposalsPerMonth: null,
      savedPlans: null,
      customization: 'advanced',
      personalization: true,
      enhancedRecommendations: true,
      priorityResponses: 'future',
    },
  },
];

/** Guests (not signed in) — D-024: 10 demo credits, saving plans requires sign-in. */
export const GUEST_ENTITLEMENTS: Entitlements = {
  monthlyCredits: 10,
  proposalsPerMonth: 2,
  savedPlans: 0,
  customization: 'basic',
  personalization: false,
  enhancedRecommendations: false,
  priorityResponses: 'not_included',
};

/**
 * Credit cost per action (PRD §9 assumption 4: 1 credit per AI reply).
 * Free by rule: browsing, saving plans (limited by plan instead), device read-aloud.
 * A proposal or voice answer IS an AI reply, so it costs the same single credit — not extra.
 */
export const USAGE_COSTS: Record<UsageAction, number> = {
  ai_reply: 1,
  voice_reply: 1,
  itinerary_proposal: 1,
  save_plan: 0,
  browse: 0,
  read_aloud: 0,
};

/** Show the "subscription expires in N days" warning at N ≤ this value. */
export const EXPIRY_WARNING_DAYS = 7;

/** "Low credits" threshold as a share of the allowance. */
export const LOW_CREDITS_RATIO = 0.2;

export const BILLING_INTERVALS: BillingInterval[] = ['monthly', 'annual'];

export function getPlan(id: PlanId): SubscriptionPlan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}
