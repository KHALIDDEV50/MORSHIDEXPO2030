'use client';

import { CalendarPlus, Clock, Cpu, Info, Map as MapIcon, MapPin, MessageCirclePlus, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { MessageBlock } from '@/entities/conversation';
import { CATEGORY_ICON, CATEGORY_TONE } from '@/entities/place';
import { AddToPlanDialog } from '@/features/add-to-plan';
import { PlaceSummaryDialog, type ResolvedStop, type SummaryTarget } from '@/features/send-chat-message';
import { localize } from '@/shared/api';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Button, DemoBadge, ImagePlaceholder, PriorityBadge } from '@/shared/ui';

type Item = Extract<MessageBlock, { type: 'recommendations' }>['items'][number];

/**
 * Recommendation cards (PRD §4.1 type 2): name, category, area, suggested duration, best time,
 * priority (demo ranking), "why this matches you", and Details · Show on map · Add to plan · Ask.
 */
export function RecommendationList({
  items,
  resolve,
  onShowOnMap,
  onAsk,
  compact = false,
}: {
  items: Item[];
  resolve: (ref: Item['ref']) => ResolvedStop | null;
  onShowOnMap?: (id: string) => void;
  onAsk: (name: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations('chatThread');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const [adding, setAdding] = useState<ResolvedStop | null>(null);
  const [summary, setSummary] = useState<SummaryTarget | null>(null);
  const resolved = items.map((item) => ({ item, stop: resolve(item.ref) })).filter((r): r is { item: Item; stop: ResolvedStop } => r.stop !== null);

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 px-1">
        <span className="type-caption text-fg-muted">{t('recommendationsLabel')}</span>
        <DemoBadge label={t('demoRanking')} />
      </p>
      <ul className="flex flex-col gap-2">
        {resolved.map(({ item, stop }) => (
          <li key={stop.id} className="border-border bg-surface flex gap-3 overflow-hidden rounded-xl border p-3">
            {!compact && (
              <ImagePlaceholder
                label={stop.name}
                tone={stop.kind === 'place' ? CATEGORY_TONE[stop.place.categories[0]!] : 'modern'}
                icon={stop.kind === 'place' ? CATEGORY_ICON[stop.place.categories[0]!] : <Cpu />}
                iconSize="sm"
                className="hidden size-20 shrink-0 rounded-lg sm:grid"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  {/* The name opens the place summary (flow: recommendation → summary → full details) */}
                  <button
                    type="button"
                    onClick={() => setSummary({ kind: stop.kind, id: stop.id })}
                    className="focus-ring hover:text-primary w-fit cursor-pointer rounded-sm text-start text-sm font-bold underline-offset-4 hover:underline"
                  >
                    {stop.kind === 'booth' && (
                      <span dir="ltr" className="text-fg-muted me-1.5 tabular-nums">
                        {stop.number}
                      </span>
                    )}
                    {stop.name}
                  </button>
                  <span className="type-caption text-fg-muted flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden />
                    {stop.categoryLabel} · {stop.area}
                  </span>
                </div>
                <PriorityBadge level={item.priority} />
              </div>
              <ul className="type-caption text-fg-secondary flex flex-wrap gap-x-3 gap-y-0.5">
                <li className="inline-flex items-center gap-1">
                  <Clock className="size-3" aria-hidden />
                  {t('suggestedDuration', { duration: formatDuration(stop.durationMin) })}
                </li>
                {stop.bestTime && (
                  <li className="inline-flex items-center gap-1">
                    <Sun className="size-3" aria-hidden />
                    {stop.bestTime}
                  </li>
                )}
              </ul>
              <p className="type-body-sm text-fg-secondary font-normal" dir="auto">
                <span className="text-fg font-medium">{t('whyMatches')} </span>
                {localize(item.reason, locale)}
              </p>
              <div className="-ms-2 flex flex-wrap gap-0.5">
                <Button size="sm" variant="ghost" onClick={() => setSummary({ kind: stop.kind, id: stop.id })}>
                  <Info aria-hidden />
                  {t('viewDetails')}
                </Button>
                {onShowOnMap && (
                  <Button size="sm" variant="ghost" onClick={() => onShowOnMap(stop.id)}>
                    <MapIcon aria-hidden />
                    {t('showOnMap')}
                  </Button>
                )}
                {stop.kind === 'place' && (
                  <Button size="sm" variant="ghost" onClick={() => setAdding(stop)}>
                    <CalendarPlus aria-hidden />
                    {t('addToPlan')}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onAsk(stop.name)}>
                  <MessageCirclePlus aria-hidden />
                  {t('askFollowUp')}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {adding?.kind === 'place' && <AddToPlanDialog place={adding.place} open onOpenChange={(o) => !o && setAdding(null)} />}
      <PlaceSummaryDialog target={summary} onOpenChange={(o) => !o && setSummary(null)} />
    </div>
  );
}
