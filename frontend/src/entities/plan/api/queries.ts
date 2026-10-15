'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PlanListQuery } from '../model/plan';
import { planRepository as repo } from './repository';

/** Mutations live in features (save-proposal, add-to-plan, guided mode …) and invalidate `planKeys.all`. */
export const planKeys = {
  all: ['plans'] as const,
  list: (q: PlanListQuery) => ['plans', 'list', q] as const,
  detail: (id: string) => ['plans', 'detail', id] as const,
  featured: () => ['plans', 'featured'] as const,
};

export function usePlans(query: PlanListQuery) {
  return useQuery({ queryKey: planKeys.list(query), queryFn: ({ signal }) => repo.list(query, signal), placeholderData: keepPreviousData });
}

/** How many plans the user has (the real count for saved-plan limits, not a stored counter). */
export function usePlanCount(): number {
  return usePlans({ tab: 'all', pageSize: 1 }).data?.total ?? 0;
}

export function usePlan(id: string | null) {
  return useQuery({ queryKey: planKeys.detail(id ?? ''), queryFn: ({ signal }) => repo.get(id as string, signal), enabled: Boolean(id) });
}

export function useFeaturedPlans() {
  return useQuery({ queryKey: planKeys.featured(), queryFn: ({ signal }) => repo.listFeatured(signal), staleTime: Infinity });
}
