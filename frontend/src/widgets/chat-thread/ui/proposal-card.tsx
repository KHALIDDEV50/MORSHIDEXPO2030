'use client';

import { CalendarCheck, Check, Clock, ListChecks, Map as MapIcon, Pencil, Route, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ItineraryProposal } from '@/entities/conversation';
import { toMinutes } from '@/entities/plan';
import type { ResolvedStop } from '@/features/send-chat-message';
import { scheduleKeptStops, useSaveChatProposal } from '@/features/save-proposal-to-plans';
import { useSubscriptionSnapshot } from '@/entities/subscription';
import { localize } from '@/shared/api';
import { requestSignIn } from '@/shared/lib/auth-gate';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, DemoBadge, PriorityBadge, toast } from '@/shared/ui';

/** Kept stops in their current order. */
export function keptStops(proposal: ItineraryProposal) {
  return proposal.stops.filter((s) => s.kept).sort((a, b) => a.order - b.order);
}

/**
 * Itinerary proposal card (PRD §4.1 type 3, D-021): a proposal until the visitor explicitly saves
 * it. Save is idempotent; afterwards the card shows "Saved · Open plan".
 */
export function ProposalCard({
  proposal,
  conversationId,
  resolve,
  onReview,
  onShowOnMap,
  onOpenPlan,
}: {
  proposal: ItineraryProposal;
  conversationId: string | null;
  resolve: (ref: ItineraryProposal['stops'][number]['ref']) => ResolvedStop | null;
  onReview?: () => void;
  onShowOnMap?: () => void;
  onOpenPlan: (planId: string) => void;
}) {
  const t = useTranslations('chatThread.proposal');
  const tp = useTranslations('proposal');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const save = useSaveChatProposal();
  const stops = keptStops(proposal);
  const times = scheduleKeptStops(proposal.startTime, proposal.bufferMin, stops);
  const last = stops.at(-1);
  const endMinutes = last ? toMinutes(times.at(-1)!) + last.durationMin : toMinutes(proposal.startTime);
  const totalMinutes = endMinutes - toMinutes(proposal.startTime);
  const savedPlanId = proposal.savedPlanId ?? save.data?.id ?? null;

  const { subscription } = useSubscriptionSnapshot();
  const onSave = async () => {
    if (!conversationId) return;
    // Guests sign in first; the save then completes (PRD §4.7)
    if (subscription === null && !(await requestSignIn())) return;
    save.mutate(
      { conversationId, proposal, keptStops: stops, locale },
      {
        onSuccess: () => toast.success(tp('savedToast'), { description: t('savedToastDescription') }),
        onError: () => toast.error(tp('saveFailed')),
      },
    );
  };

  return (
    <section aria-label={t('label', { title: localize(proposal.title, locale) })} className="border-primary/25 bg-surface flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-primary inline-flex items-center gap-1.5 text-xs font-bold">
          <Sparkles className="size-3.5" aria-hidden />
          {t('eyebrow')}
        </span>
        <DemoBadge />
      </div>
      <h3 className="type-h4">{localize(proposal.title, locale)}</h3>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={proposal.type === 'expo' ? 'roaya' : 'arif'}>
          <Route aria-hidden />
          {tp(`tripType.${proposal.type}`)}
        </Badge>
        <Badge tone="neutral">
          <ListChecks aria-hidden />
          {tp('stopsCount', { count: stops.length })}
        </Badge>
        <Badge tone="neutral">
          <Clock aria-hidden />
          {formatDuration(totalMinutes)}
        </Badge>
        <Badge tone="neutral">
          <span dir="ltr">{t('startsAt', { time: proposal.startTime })}</span>
        </Badge>
      </div>
      <p className="type-body-sm text-fg-secondary font-normal" dir="auto">
        {localize(proposal.rationale, locale)}
      </p>

      <ol className="flex flex-col gap-1.5">
        {stops.map((s, i) => {
          const stop = resolve(s.ref);
          if (!stop) return null;
          return (
            <li key={stop.id} className="bg-surface-muted flex items-center gap-2.5 rounded-md px-2.5 py-2">
              <span className="bg-primary-tint text-primary grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{stop.name}</span>
                <span className="type-caption text-fg-muted" dir="ltr">
                  {times[i]} · {formatDuration(s.durationMin)}
                </span>
              </span>
              <PriorityBadge level={s.priority} className="hidden sm:inline-flex" />
            </li>
          );
        })}
      </ol>
      <p className="type-caption text-fg-muted">{tp('estimatesNote')}</p>

      <div className="flex flex-wrap gap-2">
        {savedPlanId ? (
          <>
            <span className="text-success-fg inline-flex items-center gap-1.5 text-sm font-bold" role="status">
              <Check className="size-4" aria-hidden />
              {t('saved')}
            </span>
            <Button size="sm" variant="secondary" onClick={() => onOpenPlan(savedPlanId)}>
              <CalendarCheck aria-hidden />
              {tp('openPlan')}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="gradient" loading={save.isPending} disabled={!conversationId || stops.length === 0} onClick={() => void onSave()}>
            {!save.isPending && <Sparkles aria-hidden />}
            {save.isPending ? tp('saving') : tp('save')}
          </Button>
        )}
        {onReview && (
          <Button size="sm" variant="secondary" onClick={onReview}>
            <Pencil aria-hidden />
            {savedPlanId ? t('review') : t('reviewEdit')}
          </Button>
        )}
        {onShowOnMap && (
          <Button size="sm" variant="ghost" onClick={onShowOnMap}>
            <MapIcon aria-hidden />
            {t('showOnMap')}
          </Button>
        )}
      </div>
    </section>
  );
}
