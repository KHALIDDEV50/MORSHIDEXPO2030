'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';

/**
 * DEMO save of an AI proposal into My Plans (D-021).
 * Stand-in for `PlanRepository.createFromProposal(proposalId)` (api-contracts.md): idempotent —
 * saving the same proposal again returns the same plan id, never a duplicate.
 * In-memory only; replaced by the real repository in Phase 4/8.
 */
const savedPlans = new Map<string, string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

async function createFromProposal(proposalId: string): Promise<string> {
  const existing = savedPlans.get(proposalId);
  if (existing) return existing;
  await new Promise((resolve) => setTimeout(resolve, 900)); // simulated latency
  const again = savedPlans.get(proposalId); // a concurrent save may have finished first
  if (again) return again;
  const planId = `plan_demo_${proposalId}`;
  savedPlans.set(proposalId, planId);
  notify();
  return planId;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useSaveProposal(proposalId: string) {
  const savedPlanId = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => savedPlans.get(proposalId) ?? null,
    () => null,
  );
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = useCallback(async () => {
    if (pending) return savedPlans.get(proposalId) ?? null;
    setPending(true);
    setFailed(false);
    try {
      return await createFromProposal(proposalId);
    } catch {
      setFailed(true);
      return null;
    } finally {
      setPending(false);
    }
  }, [pending, proposalId]);

  const state: SaveState = savedPlanId ? 'saved' : pending ? 'saving' : failed ? 'error' : 'idle';
  return { state, savedPlanId, save };
}
