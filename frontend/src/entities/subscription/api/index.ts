'use client';

import { useSyncExternalStore } from 'react';
import { mockCreditsRepository, mockSubscriptionRepository, SEED_SNAPSHOT, subscriptionStore } from './subscription.mock';

/**
 * Implementation selection (architecture.md §3). Only the demo implementation exists today;
 * `NEXT_PUBLIC_DATA_SOURCE=http` will switch to an HTTP implementation once a backend exists.
 */
export const subscriptionRepository = mockSubscriptionRepository;
export const creditsRepository = mockCreditsRepository;
export { subscriptionStore };
export type { DemoProfile } from './subscription.mock';
export type { SubscriptionRepository, CreditsRepository, SubscriptionStore } from './subscription.repository';

/**
 * Current subscription, balance and history (reactive). The server snapshot is the seed, so the
 * first client render matches the HTML; the saved demo state (localStorage) follows right after.
 */
export function useSubscriptionSnapshot() {
  return useSyncExternalStore(subscriptionStore.subscribe, subscriptionStore.getSnapshot, () => SEED_SNAPSHOT);
}
