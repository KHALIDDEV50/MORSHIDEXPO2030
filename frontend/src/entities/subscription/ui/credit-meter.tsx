import { Coins } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { DemoBadge } from '@/shared/ui';
import { creditLevel, usedRatio } from '../model/rules';
import type { CreditsBalance } from '../model/types';

/** Remaining credits + allowance with an understandable usage bar (ok / low / empty). */
export function CreditMeter({ balance, compact = false, action, className }: { balance: CreditsBalance; compact?: boolean; action?: ReactNode; className?: string }) {
  const t = useTranslations('subscription.credits');
  const format = useFormatter();
  const level = creditLevel(balance);
  const remainingRatio = 1 - usedRatio(balance);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full',
              level === 'ok' && 'bg-primary-tint text-primary',
              level === 'low' && 'bg-warning-tint text-warning-fg',
              level === 'empty' && 'bg-error-tint text-error-fg',
            )}
            aria-hidden
          >
            <Coins className="size-4.5" />
          </span>
          <div className="flex flex-col">
            <span className="type-caption text-fg-muted">{t('label')}</span>
            <span className="text-fg text-lg leading-tight font-bold tabular-nums">
              {t('remainingOf', { remaining: balance.remaining, allowance: balance.allowance })}
            </span>
          </div>
        </div>
        {!compact && <DemoBadge label={t('demo')} />}
        {action}
      </div>
      <div
        role="meter"
        aria-label={t('label')}
        aria-valuemin={0}
        aria-valuemax={balance.allowance}
        aria-valuenow={balance.remaining}
        aria-valuetext={t('remainingOf', { remaining: balance.remaining, allowance: balance.allowance })}
        className="bg-surface-muted h-2 overflow-hidden rounded-full"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-standard',
            level === 'ok' && 'bg-cta',
            level === 'low' && 'bg-warning',
            level === 'empty' && 'bg-error',
          )}
          style={{ width: `${Math.round(remainingRatio * 100)}%` }}
        />
      </div>
      {!compact && (
        <p className={cn('type-caption', level === 'ok' ? 'text-fg-muted' : level === 'low' ? 'text-warning-fg' : 'text-error-fg')}>
          {level === 'empty' ? t('empty') : level === 'low' ? t('low') : balance.periodEndsAt ? t('renews', { date: format.dateTime(new Date(balance.periodEndsAt), { dateStyle: 'medium', numberingSystem: 'latn' }) }) : t('guestNote')}
        </p>
      )}
    </div>
  );
}
