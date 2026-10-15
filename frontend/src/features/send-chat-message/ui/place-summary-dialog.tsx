'use client';

import { ArrowUpRight, CalendarClock, Clock, Cpu, Lightbulb, MapPin, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CATEGORY_ICON, CATEGORY_TONE } from '@/entities/place';
import { localize } from '@/shared/api';
import { useRouter } from '@/shared/i18n';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, DemoBadge, Dialog, DialogContent, ImagePlaceholder } from '@/shared/ui';
import { useStopRefs } from '../model/use-stop-refs';

/** Which place or Expo booth to summarise (ids are the repository ids — one id per place everywhere). */
export type SummaryTarget = { kind: 'place' | 'booth'; id: string };

/** Full-details route for a target: the Discover place page, or the booth on the Expo page. */
export function detailsHref(target: SummaryTarget): string {
  return target.kind === 'place' ? `/discover/${encodeURIComponent(target.id)}` : `/expo/${encodeURIComponent(target.id)}`;
}

/**
 * Concise place (or booth) summary in a modal, opened from chat recommendations and the chat map.
 * Shows only fields that exist in the data — no invented facts, no empty fields — and labels demo
 * content (opening hours, Expo data) as demo. "Open full details" goes to the dedicated page.
 */
export function PlaceSummaryDialog({ target, onOpenChange }: { target: SummaryTarget | null; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations('placeSummary');
  const locale = useLocale();
  const router = useRouter();
  const formatDuration = useFormatDuration();
  const { resolve } = useStopRefs();
  const stop = target ? resolve(target.kind === 'place' ? { kind: 'place', placeId: target.id } : { kind: 'booth', boothId: target.id }) : null;

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      {target && (
        <DialogContent
          title={stop ? (stop.kind === 'booth' ? `${stop.number} · ${stop.name}` : stop.name) : t('notFoundTitle')}
          description={stop ? stop.area : undefined}
          footer={
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t('close')}
              </Button>
              {stop && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    router.push(detailsHref(target));
                  }}
                >
                  {t('openFull')}
                  <ArrowUpRight className="flip-rtl" aria-hidden />
                </Button>
              )}
            </div>
          }
        >
          {!stop ? (
            <p className="text-fg-secondary text-sm">{t('notFoundDescription')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Images are labelled placeholders until real assets are supplied (D-026) */}
              <ImagePlaceholder
                label={stop.name}
                tone={stop.kind === 'place' ? CATEGORY_TONE[stop.place.categories[0]!] : 'modern'}
                icon={stop.kind === 'place' ? CATEGORY_ICON[stop.place.categories[0]!] : <Cpu />}
                className="aspect-[16/9] w-full rounded-lg"
              />
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="primary">{stop.categoryLabel}</Badge>
                <Badge tone="neutral">
                  <Clock aria-hidden />
                  {t('duration', { duration: formatDuration(stop.durationMin) })}
                </Badge>
                {stop.kind === 'booth' && <DemoBadge />}
              </div>
              <p className="type-body text-fg-secondary" dir="auto">
                {stop.kind === 'place' ? localize(stop.place.description, locale) : stop.summary}
              </p>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <dt className="sr-only">{t('location')}</dt>
                  <MapPin className="text-fg-muted mt-0.5 size-4 shrink-0" aria-hidden />
                  <dd>{stop.area}</dd>
                </div>
                {stop.bestTime && (
                  <div className="flex items-start gap-2">
                    <dt className="sr-only">{t('bestTime')}</dt>
                    <Sun className="text-fg-muted mt-0.5 size-4 shrink-0" aria-hidden />
                    <dd>{t('bestTimeValue', { time: stop.bestTime })}</dd>
                  </div>
                )}
                {stop.kind === 'place' && stop.place.openingHours && (
                  <div className="flex flex-wrap items-start gap-2">
                    <dt className="sr-only">{t('hours')}</dt>
                    <CalendarClock className="text-fg-muted mt-0.5 size-4 shrink-0" aria-hidden />
                    <dd className="flex flex-wrap items-center gap-2">
                      {localize(stop.place.openingHours.text, locale)}
                      {stop.place.openingHours.provenance === 'demo' && <DemoBadge label={t('hoursDemo')} />}
                    </dd>
                  </div>
                )}
                {stop.kind === 'booth' &&
                  stop.booth.activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <dt className="sr-only">{t('activity')}</dt>
                      <CalendarClock className="text-fg-muted mt-0.5 size-4 shrink-0" aria-hidden />
                      <dd>
                        {localize(a.title, locale)}
                        {a.time && <span className="text-fg-muted"> · {t('demoTime', { time: a.time })}</span>}
                      </dd>
                    </div>
                  ))}
              </dl>
              {stop.kind === 'place' && stop.place.tips.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <Lightbulb className="text-primary size-4" aria-hidden />
                    {t('tips')}
                  </p>
                  <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal" dir="auto">
                    {stop.place.tips.map((tip, i) => (
                      <li key={i}>{localize(tip, locale)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
