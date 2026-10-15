'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

/**
 * Formats a duration in minutes for the UI language with proper plural forms
 * ("1 h 30 min" / "ساعة و30 دقيقة"). Suggested visit times are estimates, not guarantees.
 */
export function useFormatDuration(): (minutes: number) => string {
  const t = useTranslations('ui.duration');
  return useCallback(
    (total: number) => {
      const minutes = Math.max(0, Math.round(total));
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h === 0) return t('minutes', { minutes: m });
      if (m === 0) return t('hours', { hours: h });
      return t('join', { hours: t('hours', { hours: h }), minutes: t('minutes', { minutes: m }) });
    },
    [t],
  );
}
