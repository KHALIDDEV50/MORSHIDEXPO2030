'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { BoothQuery } from '../model/expo';
import { expoRepository as repo } from './repository';

export const expoKeys = {
  all: ['expo'] as const,
  layout: () => ['expo', 'layout'] as const,
  booths: (q: BoothQuery) => ['expo', 'booths', q] as const,
  booth: (id: string) => ['expo', 'booth', id] as const,
};

export function useExpoLayout() {
  return useQuery({ queryKey: expoKeys.layout(), queryFn: ({ signal }) => repo.getLayout(signal), staleTime: Infinity });
}

export function useBoothSearch(query: BoothQuery) {
  return useQuery({ queryKey: expoKeys.booths(query), queryFn: ({ signal }) => repo.searchBooths(query, signal), placeholderData: keepPreviousData });
}

export function useBooth(id: string | null) {
  return useQuery({ queryKey: expoKeys.booth(id ?? ''), queryFn: ({ signal }) => repo.getBooth(id as string, signal), enabled: Boolean(id) });
}
