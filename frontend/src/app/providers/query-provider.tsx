'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { isApiError } from '@/shared/api';

/** Errors that retrying cannot fix (contract or permission problems, aborted requests). */
const NO_RETRY = new Set(['NOT_FOUND', 'VALIDATION', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'OUT_OF_CREDITS', 'NOT_IMPLEMENTED', 'UNCONFIGURED', 'ABORTED']);

/** One QueryClient per browser session (created lazily so server renders never share state). */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => !(isApiError(error) && NO_RETRY.has(error.code)) && failureCount < 2,
          },
          mutations: { retry: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
