/**
 * Subscription & credits domain (P-012). Initial product proposal — limits, prices and entitlements
 * are configuration (see config/plans.ts), not final commercial terms.
 * Real entitlements must be enforced by the server; the frontend only reflects them.
 */
export type PlanId = 'free' | 'plus' | 'premium';
export type BillingInterval = 'monthly' | 'annual';

/**
 * Lifecycle: guest (no account) → active → cancel_scheduled (keeps access until period end)
 * → expired (falls back to free). `resume` returns cancel_scheduled → active.
 */
export type SubscriptionStatus = 'guest' | 'active' | 'cancel_scheduled' | 'expired';

export type CustomizationLevel = 'basic' | 'extended' | 'advanced';

export type Entitlements = {
  /** AI credits granted per billing period */
  monthlyCredits: number;
  /** Itinerary proposals per period; null = no separate cap (credits still apply) */
  proposalsPerMonth: number | null;
  /** Saved plans in My Plans; null = no cap; 0 = cannot save */
  savedPlans: number | null;
  customization: CustomizationLevel;
  personalization: boolean;
  enhancedRecommendations: boolean;
  /**
   * Faster/priority responses are NOT supported by the current architecture → always a future
   * capability until a backend can genuinely provide them.
   */
  priorityResponses: 'not_included' | 'future';
};

/** null = price not set yet (shown as "to be confirmed"); never invent prices. */
export type PlanPrice = { amount: number; currency: string } | null;

export type SubscriptionPlan = {
  id: PlanId;
  order: number;
  recommended?: boolean;
  entitlements: Entitlements;
  prices: Record<BillingInterval, PlanPrice>;
};

export type UserSubscription = {
  planId: PlanId;
  status: Exclude<SubscriptionStatus, 'guest'>;
  interval: BillingInterval;
  /** ISO dates (YYYY-MM-DD) */
  startedAt: string;
  renewsAt: string | null;
  endsAt: string | null;
  /** Demo/simulated record — never a real subscription */
  simulated: true;
};

/** Everything that can consume (or not) credits; costs live in config (USAGE_COSTS). */
export type UsageAction = 'ai_reply' | 'voice_reply' | 'itinerary_proposal' | 'save_plan' | 'browse' | 'read_aloud';

export type CreditsBalance = {
  remaining: number;
  allowance: number;
  /** When the allowance renews (null for guests) */
  periodEndsAt: string | null;
};

export type CreditTransaction = {
  id: string;
  kind: UsageAction | 'period_grant' | 'plan_change';
  /** Negative = spent, positive = granted */
  delta: number;
  balanceAfter: number;
  /** ISO date-time */
  at: string;
};

export type SubscriptionSnapshot = {
  /** null = guest */
  subscription: UserSubscription | null;
  balance: CreditsBalance;
  history: CreditTransaction[];
  savedPlans: number;
};
