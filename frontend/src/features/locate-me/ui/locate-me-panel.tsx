'use client';

import { LocateFixed, LocateOff, MapPinned, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';
import { useCurrentLocation, type GeolocationLike } from '../model/use-current-location';

/**
 * "Where am I?" control + result. The user's real position is shown separately from the
 * selected itinerary stop ("You" vs "Current stop"), and on failure the user is invited to
 * choose their current stop manually instead.
 */
export function LocateMePanel({
  geolocation,
  onChooseStopManually,
  className,
}: {
  geolocation?: GeolocationLike | null;
  /** Focuses the manual "Set as current stop" path in the timeline */
  onChooseStopManually?: () => void;
  className?: string;
}) {
  const t = useTranslations('trip.locate');
  const format = useFormatter();
  const { state, locate, reset } = useCurrentLocation({ geolocation });

  if (state.status === 'located') {
    const { lat, lng, accuracy, timestamp } = state.location;
    const coord = (n: number) => format.number(n, { maximumFractionDigits: 5, numberingSystem: 'latn' });
    return (
      <div role="status" className={cn('border-primary/30 bg-primary-tint/60 flex items-start gap-3 rounded-lg border p-3', className)}>
        <span className="bg-primary text-primary-fg glow-blue grid size-9 shrink-0 place-items-center rounded-full">
          <LocateFixed className="size-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-fg text-sm font-bold">{t('foundTitle')}</p>
          <p className="type-caption text-fg-secondary tabular-nums" dir="ltr">
            {coord(lat)}, {coord(lng)} · ±{format.number(Math.round(accuracy), { numberingSystem: 'latn' })} m ·{' '}
            {format.dateTime(new Date(timestamp), { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' })}
          </p>
          <p className="type-caption text-fg-muted">{t('foundNote')}</p>
        </div>
        <button type="button" onClick={reset} aria-label={t('clear')} className="focus-ring text-fg-muted hover:text-fg grid size-8 shrink-0 cursor-pointer place-items-center rounded-full">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className={cn('border-warning/40 bg-warning-tint flex items-start gap-3 rounded-lg border p-3', className)}>
        <LocateOff className="text-warning-fg mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-fg text-sm font-bold">{t(`errors.${state.code}.title`)}</p>
          <p className="type-body-sm text-fg-secondary font-normal">{t(`errors.${state.code}.body`)}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {onChooseStopManually && (
              <Button size="sm" variant="secondary" onClick={onChooseStopManually}>
                <MapPinned aria-hidden />
                {t('chooseManually')}
              </Button>
            )}
            {state.code !== 'unsupported' && state.code !== 'insecure-context' && (
              <Button size="sm" variant="ghost" onClick={locate}>
                {t('tryAgain')}
              </Button>
            )}
          </div>
        </div>
        <button type="button" onClick={reset} aria-label={t('clear')} className="focus-ring text-fg-muted hover:text-fg grid size-8 shrink-0 cursor-pointer place-items-center rounded-full">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <Button size="sm" variant="secondary" onClick={locate} loading={state.status === 'locating'}>
        {state.status !== 'locating' && <LocateFixed aria-hidden />}
        {state.status === 'locating' ? t('locating') : t('whereAmI')}
      </Button>
      <span className="type-caption text-fg-muted">{t('privacyNote')}</span>
    </div>
  );
}
