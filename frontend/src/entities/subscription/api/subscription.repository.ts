import type {
  BillingInterval,
  CreditsBalance,
  CreditTransaction,
  PlanId,
  SubscriptionPlan,
  SubscriptionSnapshot,
  UsageAction,
  UserSubscription,
} from '../model/types';

/**
 * Contracts for the future subscription backend (api-contracts.md §2–3). The demo uses
 * `subscription.mock.ts`; an HTTP implementation must provide the same methods.
 * Payment details are never handled in the frontend — checkout belongs to a payment provider
 * (not integrated; requires explicit approval).
 */
export interface SubscriptionRepository {
  listPlans(): Promise<SubscriptionPlan[]>;
  getCurrent(): Promise<UserSubscription | null>;
  changePlan(input: { planId: PlanId; interval: BillingInterval }): Promise<UserSubscription>;
  /** Schedules cancellation at period end (access continues until then) */
  cancel(): Promise<UserSubscription>;
  resume(): Promise<UserSubscription>;
}

export interface CreditsRepository {
  getBalance(): Promise<CreditsBalance>;
  history(): Promise<CreditTransaction[]>;
  /** Server-validated in production; rejects with OUT_OF_CREDITS when not allowed */
  consume(action: UsageAction): Promise<CreditsBalance>;
}

/** Reactive read model for the UI (demo store; a real app would use TanStack Query). */
export interface SubscriptionStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): SubscriptionSnapshot;
}
