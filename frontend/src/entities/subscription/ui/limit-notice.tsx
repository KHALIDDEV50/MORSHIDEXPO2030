import { Gauge } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

/**
 * Explains a reached limit in plain words and offers a next step — non-blocking:
 * everything that is free (browsing, reading, saved plans) keeps working.
 */
export function LimitNotice({
  kind,
  action,
  className,
}: {
  kind: 'low_credits' | 'out_of_credits' | 'save_limit' | 'sign_in_required';
  action?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('subscription.limits');
  return (
    <div role="status" className={cn('border-warning/40 bg-warning-tint flex flex-wrap items-start gap-3 rounded-lg border p-3.5', className)}>
      <Gauge className="text-warning-fg mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-fg text-sm font-bold">{t(`${kind}.title`)}</p>
        <p className="type-body-sm text-fg-secondary font-normal">{t(`${kind}.body`)}</p>
      </div>
      {action && <div className="w-full sm:ms-auto sm:w-auto">{action}</div>}
    </div>
  );
}
