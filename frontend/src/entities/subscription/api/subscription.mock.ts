import { ApiError, createDemoStore } from '@/shared/api';
import { PLANS, getPlan } from '../config/plans';
import { SubscriptionSnapshotSchema } from '../model/schema';
import { applyUsage, checkUsage, entitlementsFor, rebalanceForPlan } from '../model/rules';
import type {
  BillingInterval,
  CreditTransaction,
  PlanId,
  SubscriptionSnapshot,
  UsageAction,
  UserSubscription,
} from '../model/types';
import type { CreditsRepository, SubscriptionRepository, SubscriptionStore } from './subscription.repository';

/**
 * DEMO subscription + credits service (in memory, clearly simulated).
 * No payment, no real subscription, no real cancellation. The demo "today" is fixed so dates
 * in screenshots and reviews are stable.
 */
const DEMO_TODAY = '2026-10-11';
const DEMO_RENEWAL = '2026-11-11';
const latency = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

let txCounter = 0;
const tx = (kind: CreditTransaction['kind'], delta: number, balanceAfter: number, at: string): CreditTransaction => ({
  id: `tx_${++txCounter}`,
  kind,
  delta,
  balanceAfter,
  at,
});

function demoHistory(allowance: number, used: number): CreditTransaction[] {
  const items: CreditTransaction[] = [tx('period_grant', allowance, allowance, `${DEMO_TODAY.slice(0, 8)}01T08:00:00Z`)];
  let balance = allowance;
  const kinds: UsageAction[] = ['ai_reply', 'ai_reply', 'itinerary_proposal', 'voice_reply', 'ai_reply', 'save_plan'];
  for (let i = 0; i < used; i++) {
    const kind = kinds[i % kinds.length] as UsageAction;
    const cost = kind === 'save_plan' ? 0 : 1;
    balance -= cost;
    const day = String(2 + (i % 9)).padStart(2, '0'); // stays within the current demo period (Oct 2–10)
    items.push(tx(kind, -cost, balance, `${DEMO_TODAY.slice(0, 8)}${day}T1${i % 10}:${String(10 + i).slice(-2)}:00Z`));
  }
  return items.reverse();
}

function signedInState(planId: PlanId, interval: BillingInterval, used: number): SubscriptionSnapshot {
  const allowance = getPlan(planId).entitlements.monthlyCredits;
  const subscription: UserSubscription = {
    planId,
    status: 'active',
    interval,
    startedAt: '2026-09-11',
    renewsAt: DEMO_RENEWAL,
    endsAt: null,
    simulated: true,
  };
  const history = demoHistory(allowance, used);
  const spent = history.reduce((sum, t) => (t.delta < 0 ? sum - t.delta : sum), 0);
  return { subscription, balance: { remaining: allowance - spent, allowance, periodEndsAt: DEMO_RENEWAL }, history, savedPlans: 2 };
}

function guestState(): SubscriptionSnapshot {
  const allowance = entitlementsFor(null).monthlyCredits;
  return { subscription: null, balance: { remaining: 7, allowance, periodEndsAt: null }, history: demoHistory(allowance, 3).slice(0, 4), savedPlans: 0 };
}

export type DemoProfile = 'guest' | 'free' | 'plus' | 'premium' | 'free_low' | 'plus_expiring';

/** Local calendar date `days` from now as YYYY-MM-DD (keeps the expiring demo relative to today). */
function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initial(profile: DemoProfile): SubscriptionSnapshot {
  switch (profile) {
    case 'guest':
      return guestState();
    case 'free_low':
      // 31 actions incl. 5 free saves → 26 credits spent of 30 → 4 left (low)
      return signedInState('free', 'monthly', 31);
    case 'plus':
      return signedInState('plus', 'monthly', 12);
    case 'plus_expiring': {
      // Cancellation scheduled; access ends 5 days from today → header shows the expiry warning
      const base = signedInState('plus', 'monthly', 12);
      return base.subscription
        ? { ...base, subscription: { ...base.subscription, status: 'cancel_scheduled', renewsAt: null, endsAt: isoInDays(5) } }
        : base;
    }
    case 'premium':
      return signedInState('premium', 'annual', 40);
    default:
      return signedInState('free', 'monthly', 8);
  }
}

/** What the server renders (and the first client render hydrates against). */
// Traveler: the demo account starts with 6 plans, above Explorer's 3-plan limit (switch plans in Settings to see it)
export const SEED_SNAPSHOT: SubscriptionSnapshot = initial('plus');

/** Persistent DEMO store (localStorage `morshid:v1:subscription`, reset by "Reset demo data"). */
const store = createDemoStore('subscription', SubscriptionSnapshotSchema, () => SEED_SNAPSHOT);
const set = (next: SubscriptionSnapshot) => store.set(next);

export const subscriptionStore: SubscriptionStore & { loadDemoProfile(profile: DemoProfile): void } = {
  subscribe: (listener) => store.subscribe(listener),
  getSnapshot: () => store.get(),
  /** Demo control: switch between guest / plan profiles (gallery, ?demoProfile=) */
  loadDemoProfile(profile) {
    set(initial(profile));
  },
};

export const mockSubscriptionRepository: SubscriptionRepository = {
  async listPlans() {
    return PLANS;
  },
  async getCurrent() {
    const state = store.get();
    return state.subscription;
  },
  async changePlan({ planId, interval }) {
    await latency();
    const state = store.get(); // read after the delay so concurrent changes aren't lost
    if (!state.subscription) throw new ApiError('UNAUTHORIZED', 'SIGN_IN_REQUIRED');
    const allowance = getPlan(planId).entitlements.monthlyCredits;
    const balance = rebalanceForPlan(state.balance, allowance);
    const subscription: UserSubscription = {
      ...state.subscription,
      planId,
      interval,
      status: 'active',
      endsAt: null,
      renewsAt: DEMO_RENEWAL,
    };
    set({
      ...state,
      subscription,
      balance,
      history: [tx('plan_change', balance.remaining - state.balance.remaining, balance.remaining, new Date().toISOString()), ...state.history],
    });
    return subscription;
  },
  async cancel() {
    await latency();
    const state = store.get(); // read after the delay so concurrent changes aren't lost
    if (!state.subscription) throw new ApiError('UNAUTHORIZED', 'SIGN_IN_REQUIRED');
    const subscription: UserSubscription = { ...state.subscription, status: 'cancel_scheduled', endsAt: state.subscription.renewsAt, renewsAt: null };
    set({ ...state, subscription });
    return subscription;
  },
  async resume() {
    await latency();
    const state = store.get(); // read after the delay so concurrent changes aren't lost
    if (!state.subscription) throw new ApiError('UNAUTHORIZED', 'SIGN_IN_REQUIRED');
    const subscription: UserSubscription = { ...state.subscription, status: 'active', renewsAt: state.subscription.endsAt ?? DEMO_RENEWAL, endsAt: null };
    set({ ...state, subscription });
    return subscription;
  },
};

export const mockCreditsRepository: CreditsRepository = {
  async getBalance() {
    const state = store.get();
    return state.balance;
  },
  async history() {
    const state = store.get();
    return state.history;
  },
  async consume(action) {
    const state = store.get();
    const check = checkUsage(state.balance, action);
    if (!check.allowed) throw new ApiError('OUT_OF_CREDITS');
    const balance = applyUsage(state.balance, action);
    set({
      ...state,
      balance,
      history: check.cost > 0 ? [tx(action, -check.cost, balance.remaining, new Date().toISOString()), ...state.history] : state.history,
    });
    return balance;
  },
};
