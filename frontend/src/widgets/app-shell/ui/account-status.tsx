'use client';

import { CalendarClock, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { creditLevel, expiryWarningDays, useSubscriptionSnapshot } from '@/entities/subscription';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';

/** Re-evaluates "today" every hour so a day-based countdown stays correct in a long-open tab. */
function useNow(intervalMs = 60 * 60 * 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Remaining AI credits (desktop header, beside notifications). Reads the shared credit store, so it
 * updates with every spend or plan change. Opens the existing Settings → Subscription section.
 */
export function CreditsIndicator({ className }: { className?: string }) {
  const t = useTranslations('shell.credits');
  const { balance } = useSubscriptionSnapshot();
  const level = creditLevel(balance);
  return (
    <Link
      href="/settings#subscription"
      aria-label={t('aria', { remaining: balance.remaining, allowance: balance.allowance })}
      title={t('aria', { remaining: balance.remaining, allowance: balance.allowance })}
      className={cn(
        'focus-ring border-border bg-surface hover:bg-surface-muted inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold tabular-nums transition-colors',
        level === 'ok' && 'text-fg',
        level === 'low' && 'border-warning/50 text-warning-fg',
        level === 'empty' && 'border-error/50 text-error-fg',
        className,
      )}
    >
      <Coins className={cn('size-4', level === 'ok' && 'text-primary')} aria-hidden />
      <span dir="ltr">{balance.remaining}</span>
    </Link>
  );
}

/**
 * "Subscription expires in N days" — only for a subscription that will actually end
 * (cancellation scheduled / non-renewing) within EXPIRY_WARNING_DAYS. Computed from the demo
 * subscription's end date and today's date; never shown for expired, guest or auto-renewing plans.
 */
export function ExpiryWarning({ className }: { className?: string }) {
  const t = useTranslations('shell');
  const { subscription } = useSubscriptionSnapshot();
  const now = useNow();
  const days = expiryWarningDays(subscription, now);
  if (days === null) return null;
  return (
    <Link
      href="/settings#subscription"
      className={cn(
        'focus-ring border-warning/40 bg-warning-tint text-warning-fg inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold',
        className,
      )}
    >
      <CalendarClock className="size-3.5" aria-hidden />
      {t('expiry', { days })}
    </Link>
  );
}
