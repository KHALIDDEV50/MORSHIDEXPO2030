'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from '@/shared/i18n';
import { parseDiscoverParams, serializeDiscoverParams, type DiscoverParams } from './discover-params';

/**
 * Discover params from the URL plus an updater. Updates replace the history entry (typing and
 * filtering don't flood the back button) and keep the scroll position. Needs a Suspense boundary
 * (useSearchParams on a statically rendered page).
 */
export function useDiscoverParams(): [DiscoverParams, (patch: Partial<DiscoverParams> | ((current: DiscoverParams) => DiscoverParams)) => void] {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useMemo(() => parseDiscoverParams(search), [search]);

  const update = useCallback(
    (patch: Partial<DiscoverParams> | ((current: DiscoverParams) => DiscoverParams)) => {
      const next = typeof patch === 'function' ? patch(params) : { ...params, ...patch };
      const qs = serializeDiscoverParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return [params, update];
}
