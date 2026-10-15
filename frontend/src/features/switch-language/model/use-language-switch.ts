'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@/shared/config';
import { usePathname, useRouter } from '@/shared/i18n';

/**
 * Switches the UI language while keeping the current page and query string (architecture.md §5).
 * Uses `useSearchParams`, so callers must sit inside a <Suspense> boundary.
 */
export function useLanguageSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query }, { locale: next, scroll: false });
    });
  };

  return { locale, switchTo, pending };
}
