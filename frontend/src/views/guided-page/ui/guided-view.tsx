'use client';

import { Check, ChevronsRight, Clock, ExternalLink, Lightbulb, ListOrdered, Map as MapIcon, MapPin, PartyPopper, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { usePlan, type DerivedStop, type Plan } from '@/entities/plan';
import { usePlanActions } from '@/features/manage-plan';
import { isApiError, localize } from '@/shared/api';
import { Link, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { googleMapsDirectionsUrl } from '@/shared/lib/google-maps-link';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, EmptyState, ErrorState, RouteMarkerVisual, Sheet, SheetContent, Skeleton } from '@/shared/ui';
import { PlanRouteMap, usePlanTrip, type TripItem } from '@/widgets/plan-trip';

/** Guided Start Plan mode (D-017–D-019): one stop at a time, manual completion, never GPS. */
export function GuidedView({ planId }: { planId: string }) {
  const t = useTranslations('guided');
  const query = usePlan(planId);
  if (query.isPending) return <Skeleton className="m-4 h-[80dvh] rounded-xl" />;
  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        {isApiError(query.error) && query.error.code === 'NOT_FOUND' ? (
          <EmptyState title={t('notFound')} action={<Button asChild variant="secondary"><Link href="/plans">{t('backToPlans')}</Link></Button>} />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }
  return <Guided plan={query.data} />;
}

/** Stops still to do (the start point is never "done"). */
const pending = (items: DerivedStop<TripItem>[]) => items.filter((s) => s.kind !== 'start' && !s.completed);

function Guided({ plan }: { plan: Plan }) {
  const t = useTranslations('guided');
  const locale = useLocale();
  const router = useRouter();
  const formatDuration = useFormatDuration();
  const [character] = useActiveCharacter();
  const actions = usePlanActions();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(() => new Set());
  const [listOpen, setListOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Arriving here directly also starts the plan (In progress) — drafts excepted
  useEffect(() => {
    if (!plan.isDraft && !plan.startedAt) actions.start.mutate(plan.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per plan
  }, [plan.id]);

  // The guided "current" stop: chosen by the visitor, else the first one not done (skipped ones last)
  const trip = usePlanTrip(plan, null);
  const current = useMemo(() => {
    if (!trip) return null;
    const open = pending(trip.items);
    const chosen = chosenId ? trip.items.find((s) => s.id === chosenId && !s.completed) : undefined;
    return chosen ?? open.find((s) => !skipped.has(s.id)) ?? open[0] ?? null;
  }, [trip, chosenId, skipped]);

  if (!trip) return null;
  const steps = trip.items.filter((s) => s.kind !== 'start');
  const position = current ? steps.findIndex((s) => s.id === current.id) + 1 : steps.length;
  const done = trip.progress.total > 0 && trip.progress.completed === trip.progress.total;

  if (plan.isDraft) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <EmptyState title={t('draftTitle')} description={t('draftDescription')} action={<Button asChild><Link href={`/plans/${plan.id}/edit`}>{t('finishDraft')}</Link></Button>} />
      </div>
    );
  }

  const markDone = async (item: TripItem) => {
    if (!item.repoStopId) return;
    await actions.toggleCompleted(plan, item.repoStopId, true, item.name);
    setChosenId(null);
  };
  const skip = (item: TripItem) => {
    setSkipped((prev) => new Set(prev).add(item.id));
    setChosenId(null);
  };

  const position3 = current?.mapPosition;
  const mapsUrl = plan.type === 'tourism' && position3 && !Array.isArray(position3) ? googleMapsDirectionsUrl(position3) : null;
  const narration = current?.resolved?.kind === 'place' ? (current.resolved.place.narration ?? current.resolved.place.history) : undefined;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col gap-4 px-4 pt-4 pb-32 md:min-h-[calc(100dvh-4rem)]">
      {/* Header: exit, plan, X of Y */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/plans/${plan.id}`}>
              <X aria-hidden />
              {t('exit')}
            </Link>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setListOpen(true)}>
            <ListOrdered aria-hidden />
            {t('allStops')}
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="type-caption text-fg-muted" dir="auto">
            {plan.name}
          </p>
          <p className="text-sm font-bold" aria-live="polite">
            {done ? t('allDone') : t('position', { position, total: steps.length })}
          </p>
          <div className="bg-surface-muted h-2 overflow-hidden rounded-full" role="progressbar" aria-valuemin={0} aria-valuemax={trip.progress.total} aria-valuenow={trip.progress.completed} aria-label={t('progressLabel', { completed: trip.progress.completed, total: trip.progress.total })}>
            <div className="bg-cta h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.round(trip.progress.ratio * 100)}%` }} />
          </div>
        </div>
      </header>

      {done ? (
        <section className="border-border bg-surface flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center">
          <span className="bg-success-tint text-success-fg grid size-16 place-items-center rounded-full">
            <PartyPopper className="size-8" aria-hidden />
          </span>
          <h1 className="type-h2">{t('completedTitle')}</h1>
          <p className="text-fg-secondary max-w-sm">{t('completedDescription', { name: plan.name })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/plans?tab=completed">{t('toCompleted')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/plans/${plan.id}`}>{t('viewPlan')}</Link>
            </Button>
          </div>
        </section>
      ) : current ? (
        <section aria-labelledby="guided-current" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <RouteMarkerVisual kind={current.kind} status="current" number={current.number} size="lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="type-caption text-primary font-bold">{current.kind === 'destination' ? t('finalStop') : t('currentStop')}</span>
              <h1 id="guided-current" className="type-h2">
                {current.name}
              </h1>
              {current.area && (
                <p className="text-fg-secondary flex items-center gap-1.5 text-sm">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {current.area}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">
              <Clock aria-hidden />
              <span dir="ltr">{current.plannedTime}</span>
            </Badge>
            {current.durationMin > 0 && <Badge tone="neutral">{t('stayFor', { duration: formatDuration(current.durationMin) })}</Badge>}
            {current.status === 'overdue' && <Badge tone="warning">{t('overdue')}</Badge>}
          </div>
          {current.description && (
            <p className="type-body text-fg-secondary" dir="auto">
              {current.description}
            </p>
          )}
          {narration && (
            <figure className="bg-surface-brand flex items-start gap-2.5 rounded-xl p-3">
              <CharacterAvatar id={character} size="sm" />
              <blockquote className="type-body-sm" dir="auto">
                {localize(narration, locale)}
              </blockquote>
            </figure>
          )}
          {current.tips.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <Lightbulb className="text-primary size-4" aria-hidden />
                {t('tips')}
              </p>
              <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal" dir="auto">
                {current.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {mapsUrl && (
              <Button asChild variant="secondary" size="sm">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  {t('googleMaps')}
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowMap((s) => !s)} aria-expanded={showMap}>
              <MapIcon aria-hidden />
              {showMap ? t('hideMap') : t('showMap')}
            </Button>
          </div>
          {plan.type === 'expo' && <p className="type-caption text-fg-muted">{t('expoNote')}</p>}
        </section>
      ) : null}

      {showMap && !done && (
        <PlanRouteMap
          type={plan.type}
          items={trip.items}
          progressIndex={trip.progressIndex}
          layout={trip.layout}
          selectedId={current?.id ?? null}
          onSelect={(id) => id && setChosenId(id)}
          className="border-border h-64 rounded-xl border"
        />
      )}

      {/* Fixed actions (the phone bottom nav is hidden in guided mode — D-015) */}
      {!done && current && (
        <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-10 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:start-20 md:group-data-[sidebar=expanded]/shell:start-60 xl:group-data-[sidebar=auto]/shell:start-60">
          <div className="mx-auto flex w-full max-w-2xl gap-2">
            <Button variant="secondary" onClick={() => skip(current)} className="shrink-0">
              <ChevronsRight className="flip-rtl" aria-hidden />
              {t('skip')}
            </Button>
            <Button variant="gradient" className="flex-1" loading={actions.setCompleted.isPending} onClick={() => void markDone(current)}>
              <Check aria-hidden />
              {current.kind === 'destination' ? t('arrived') : t('markDone')}
            </Button>
          </div>
          <p className="type-caption text-fg-muted mx-auto mt-1.5 max-w-2xl text-center">{t('manualNote')}</p>
        </div>
      )}

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="bottom" title={t('allStops')}>
          <ol className="flex flex-col gap-1.5">
            {trip.items.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={s.kind === 'start' || s.completed}
                  aria-current={s.id === current?.id ? 'step' : undefined}
                  onClick={() => {
                    setChosenId(s.id);
                    setListOpen(false);
                  }}
                  className={cn(
                    'focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start disabled:cursor-default',
                    s.id === current?.id ? 'bg-selection' : 'enabled:hover:bg-surface-muted',
                  )}
                >
                  <RouteMarkerVisual kind={s.kind} status={s.id === current?.id ? 'current' : s.status} number={s.number} size="sm" />
                  <span className={cn('min-w-0 flex-1 truncate text-sm', s.completed && 'text-fg-muted line-through')}>{s.name}</span>
                  <span className="text-fg-muted text-xs" dir="ltr">
                    {s.plannedTime}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <Button variant="ghost" className="mt-3 w-full" onClick={() => router.push(`/plans/${plan.id}`)}>
            {t('openPlan')}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
