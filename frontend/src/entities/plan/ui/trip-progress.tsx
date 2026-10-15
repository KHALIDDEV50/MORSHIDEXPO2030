import { Clock, TriangleAlert } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import type { DerivedStop, TripProgress as Progress } from '../model/trip';

function formatDuration(t: ReturnType<typeof useTranslations<'trip'>>, minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return t('duration.hm', { h, m });
  if (h) return t('duration.h', { h });
  return t('duration.m', { m });
}

/**
 * Compact progress summary: one segment per stop (in route order) so progress reads at a glance,
 * plus counts, the current stop and the schedule. Progress comes only from manually completed stops.
 */
export function TripProgressSummary({
  progress,
  stops,
  currentName,
  className,
}: {
  progress: Progress;
  stops: DerivedStop[];
  currentName?: string;
  className?: string;
}) {
  const t = useTranslations('trip');
  const format = useFormatter();
  const pct = Math.round(progress.ratio * 100);
  const counted = stops.filter((s) => s.kind !== 'start');

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <p className="type-caption text-fg-muted">{t('progress.label')}</p>
          <p className="text-fg text-lg leading-tight font-bold tabular-nums">
            {t('progress.completedOf', { completed: progress.completed, total: progress.total })}
          </p>
        </div>
        <p className="text-brand-gradient font-display text-3xl leading-none font-extrabold tabular-nums" aria-hidden>
          {format.number(pct, { numberingSystem: 'latn' })}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={t('progress.label')}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
        aria-valuetext={t('progress.completedOf', { completed: progress.completed, total: progress.total })}
        className="flex h-2.5 gap-1"
      >
        {counted.map((s) => (
          <span
            key={s.id}
            className={cn(
              'h-full flex-1 rounded-full',
              s.status === 'completed' && 'bg-cta',
              s.status === 'current' && 'bg-primary/35 ring-primary ring-1 motion-safe:animate-pulse',
              s.status === 'overdue' && 'bg-warning/70',
              s.status === 'upcoming' && 'bg-border-strong/70',
            )}
          />
        ))}
      </div>

      <dl className="text-fg-secondary grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm @md:grid-cols-4">
        <div className="flex flex-col">
          <dt className="type-caption text-fg-muted">{t('progress.remaining')}</dt>
          <dd className="text-fg font-bold tabular-nums">{progress.remaining}</dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="type-caption text-fg-muted">{t('progress.current')}</dt>
          <dd className="text-fg truncate font-bold">{currentName ?? t('progress.noCurrent')}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="type-caption text-fg-muted">{t('progress.schedule')}</dt>
          <dd className="text-fg flex items-center gap-1 font-bold tabular-nums" dir="ltr">
            <Clock className="text-fg-muted size-3.5" aria-hidden />
            {progress.firstTime}–{progress.lastEnd}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="type-caption text-fg-muted">{t('progress.planned')}</dt>
          <dd className="text-fg font-bold">{formatDuration(t, progress.plannedMinutes)}</dd>
        </div>
      </dl>

      {progress.overdue > 0 && (
        <p className="text-warning-fg bg-warning-tint flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {t('progress.overdue', { count: progress.overdue })}
        </p>
      )}
    </div>
  );
}

export { formatDuration };
