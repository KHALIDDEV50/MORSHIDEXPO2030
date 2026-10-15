'use client';

import { useCallback, useState } from 'react';
import {
  checkUsage,
  creditsRepository,
  subscriptionRepository,
  subscriptionStore,
  type BillingInterval,
  type PlanId,
  type UsageAction,
} from '@/entities/subscription';

type Pending = 'change' | 'cancel' | 'resume' | null;

/**
 * DEMO subscription actions. They go through the repository interfaces, so a real backend +
 * payment provider can replace the mock without UI changes. Nothing here charges money.
 */
export function useSubscriptionActions() {
  const [pending, setPending] = useState<Pending>(null);

  const run = useCallback(async <T,>(kind: Exclude<Pending, null>, fn: () => Promise<T>) => {
    setPending(kind);
    try {
      return await fn();
    } finally {
      setPending(null);
    }
  }, []);

  return {
    pending,
    changePlan: (planId: PlanId, interval: BillingInterval) => run('change', () => subscriptionRepository.changePlan({ planId, interval })),
    cancel: () => run('cancel', () => subscriptionRepository.cancel()),
    resume: () => run('resume', () => subscriptionRepository.resume()),
  };
}

/**
 * Spends credits for an action using the shared rules; returns false (without throwing) when the
 * user is out of credits so callers can show the limit notice instead of failing.
 */
export function useSpendCredits() {
  return useCallback(async (action: UsageAction): Promise<boolean> => {
    if (!checkUsage(subscriptionStore.getSnapshot().balance, action).allowed) return false;
    try {
      await creditsRepository.consume(action);
      return true;
    } catch {
      return false;
    }
  }, []);
}
