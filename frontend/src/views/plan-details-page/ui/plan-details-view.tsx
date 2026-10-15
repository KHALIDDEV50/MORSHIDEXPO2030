'use client';

import { ArrowLeft, CalendarDays, Clock, Info, List, ListChecks, Map as MapIcon, Pencil, Play, Route, Trash2, TriangleAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { planStatus, totalDurationMin, TripProgressSummary, usePlan, type Plan, type PlanStatus } from '@/entities/plan';
import { DeletePlanDialog, ReplaceStopDialog, usePlanActions } from '@/features/manage-plan';
import { isApiError } from '@/shared/api';
import { Link, usePathname, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, EmptyState, ErrorState, SegmentedControl, Skeleton, toast } from '@/shared/ui';
import { ChatDock, useDockTarget, type DockTarget } from '@/widgets/chat-thread';
import { ItinerarySteps, planAdvice, PlanRouteMap, usePlanTrip } from '@/widgets/plan-trip';

const STATUS_TONE: Record<PlanStatus, 'neutral' | 'primary' | 'pink' | 'success'> = { draft: 'neutral', upcoming: 'primary', in_progress: 'pink', completed: 'success' };

export function PlanDetailsView({ planId }: { planId: string }) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 rounded-xl" />}>
      <PlanDetailsPage planId={planId} />
    </Suspense>
  );
}

function PlanDetailsPage({ planId }: { planId: string }) {
  const t = useTranslations('planDetails');
  const query = usePlan(planId);
  if (query.isPending) {
    return (
      <div className="bg-page flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6" aria-busy="true">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        {isApiError(query.error) && query.error.code === 'NOT_FOUND' ? (
          <EmptyState
            icon={<Route />}
            title={t('notFoundTitle')}
            description={t('notFoundDescription')}
            action={
              <Button asChild variant="secondary">
                <Link href="/plans">{t('backToPlans')}</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }
  return <PlanDetails plan={query.data} />;
}

/** Plan details (PRD §4.4, Screen 13): summary, advice, List / Map (synced), Start · Edit · Delete. */
function PlanDetails({ plan }: { plan: Plan }) {
  const t = useTranslations('planDetails');
  const tp = useTranslations('plansPage');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const formatDuration = useFormatDuration();
  const view = search.get('view') === 'map' ? 'map' : 'list';
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  /** The step being discussed in the chat popup (keeps its own conversation per step) */
  const [askTarget, setAskTarget] = useState<DockTarget | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [character] = useActiveCharacter();
  const tc = useTranslations('characters');
  const actions = usePlanActions();
  const trip = usePlanTrip(plan, currentId);
  const status = planStatus(plan);

  if (!trip) return null;
  const advice = planAdvice(plan, trip.items, locale);

  const setView = (v: 'list' | 'map') => {
    const next = new URLSearchParams(search.toString());
    if (v === 'map') next.set('view', 'map');
    else next.delete('view');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id) setExpanded((prev) => new Set(prev).add(id));
  };

  const toggleCompleted = (id: string) => {
    const item = trip.items.find((s) => s.id === id);
    if (!item?.repoStopId) return;
    void actions.toggleCompleted(plan, item.repoStopId, !item.completed, item.name);
  };

  const removeStop = (id: string) => {
    const item = trip.items.find((s) => s.id === id);
    if (!item?.repoStopId || item.kind !== 'visit') return;
    const previous = [...plan.stops].sort((a, b) => a.order - b.order).map((s) => ({ ...s }));
    actions.removeStop.mutate(
      { planId: plan.id, stopId: item.repoStopId },
      {
        onSuccess: () =>
          toast(t('removedToast', { name: item.name }), {
            action: {
              label: t('undo'),
              // Undo restores the exact previous list (ids, order and completion)
              onClick: () => actions.restoreStops.mutate({ planId: plan.id, stops: previous }),
            },
          }),
      },
    );
  };

  const startPlan = () => {
    if (plan.isDraft) {
      router.push(`/plans/${plan.id}/edit`);
      return;
    }
    actions.start.mutate(plan.id, { onSuccess: () => router.push(`/plans/${plan.id}/guide`) });
  };

  const timeline = (
    <ItinerarySteps
      steps={trip.items}
      selectedId={selectedId}
      expandedIds={expanded}
      onToggleExpanded={(id) => {
        setSelectedId(id);
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }}
      onToggleCompleted={toggleCompleted}
      onAsk={(step) => {
        const r = step.resolved;
        if (!r) return;
        setAskTarget({ kind: r.kind, id: r.id, name: step.name });
        setAskOpen(true);
      }}
      onReplace={(step) => step.repoStopId && setReplacingId(step.repoStopId)}
      onShowOnMap={(id) => {
        select(id);
        setView('map');
      }}
      onSetCurrent={(id) => {
        setCurrentId(id);
        select(id);
      }}
      onRemove={removeStop}
    />
  );

  const visits = trip.items.filter((s) => s.kind === 'visit').length;

  return (
    <div className="bg-page flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-6 pb-24 sm:px-6 lg:pt-8">
        <Link href="/plans" className="focus-ring text-fg-secondary hover:text-fg inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium">
          <ArrowLeft className="flip-rtl size-4" aria-hidden />
          {t('backToPlans')}
        </Link>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="type-h1" dir="auto">
              {plan.name}
            </h1>
            <p className="type-body text-fg-secondary flex items-center gap-2">
              <CharacterAvatar id={character} size="xs" ring={false} decorative />
              {t('guidedIntro', { name: tc(`${character}.name`), count: visits })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={STATUS_TONE[status]}>{tp(`status.${status}`)}</Badge>
              <Badge tone={plan.type === 'expo' ? 'roaya' : 'arif'}>{tp(`type.${plan.type}`)}</Badge>
              <Badge tone="neutral">
                <CalendarDays aria-hidden />
                {plan.date ? format.dateTime(new Date(`${plan.date}T00:00:00`), { weekday: 'long', day: 'numeric', month: 'long' }) : tp('noDate')}
              </Badge>
              {plan.startTime && (
                <Badge tone="neutral">
                  <Clock aria-hidden />
                  <span dir="ltr">{plan.startTime}</span>
                </Badge>
              )}
              <Badge tone="neutral">
                <ListChecks aria-hidden />
                {tp('stopsCount', { count: visits })}
              </Badge>
              <Badge tone="neutral">{t('totalDuration', { duration: formatDuration(totalDurationMin(plan)) })}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {status !== 'completed' && (
              <Button variant="gradient" onClick={startPlan} loading={actions.start.isPending}>
                <Play aria-hidden />
                {plan.isDraft ? t('finishDraft') : status === 'in_progress' ? t('continuePlan') : t('startPlan')}
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href={`/plans/${plan.id}/edit`}>
                <Pencil aria-hidden />
                {t('edit')}
              </Link>
            </Button>
            <Button variant="danger" onClick={() => setDeleting(true)}>
              <Trash2 aria-hidden />
              {t('delete')}
            </Button>
          </div>
        </header>

        <TripProgressSummary progress={trip.progress} stops={trip.items} currentName={trip.current?.name} className="border-border bg-surface rounded-2xl border p-4 shadow-xs sm:p-5" />

        {advice.length > 0 && (
          <section aria-labelledby="advice-title" className="border-border bg-surface-muted/50 flex flex-col gap-2 rounded-2xl border p-4 sm:p-5">
            <h2 id="advice-title" className="text-sm font-bold">
              {t('adviceTitle')}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {advice.map((a, i) => (
                <li key={i} className={cn('flex items-start gap-2 text-sm', a.tone === 'warning' ? 'text-warning-fg' : 'text-fg-secondary')}>
                  {a.tone === 'warning' ? <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden />}
                  <span>{t(`advice.${a.key}`, a.values ?? {})}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex items-center justify-between gap-2">
          <h2 className="type-h3">{t('itinerary')}</h2>
          <SegmentedControl
            label={t('viewLabel')}
            value={view}
            onValueChange={setView}
            options={[
              { value: 'list', label: t('viewList'), icon: <List aria-hidden /> },
              { value: 'map', label: t('viewMap'), icon: <MapIcon aria-hidden /> },
            ]}
          />
        </div>

        {plan.stops.length === 0 ? (
          <EmptyState
            icon={<Route />}
            title={t('noStopsTitle')}
            description={t('noStopsDescription')}
            action={
              <Button asChild>
                <Link href={`/plans/${plan.id}/edit`}>{t('addStops')}</Link>
              </Button>
            }
          />
        ) : view === 'list' ? (
          timeline
        ) : (
          // ≥1280: the map keeps a compact synced stop list beside it (PRD §4.4)
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <PlanRouteMap
              type={plan.type}
              items={trip.items}
              progressIndex={trip.progressIndex}
              layout={trip.layout}
              selectedId={selectedId}
              onSelect={select}
              className="border-border h-[60vh] min-h-[22rem] rounded-xl border"
            />
            <ol className="border-border hidden max-h-[60vh] flex-col gap-1 overflow-y-auto rounded-xl border p-2 xl:flex" aria-label={t('itinerary')}>
              {trip.items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={s.id === selectedId}
                    onClick={() => select(s.id)}
                    className={cn('focus-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm', s.id === selectedId ? 'bg-selection' : 'hover:bg-surface-muted')}
                  >
                    <span className="text-fg-muted w-6 shrink-0 text-center text-xs font-bold tabular-nums">{s.number ?? (s.kind === 'start' ? '•' : '⚑')}</span>
                    <span className={cn('min-w-0 flex-1 truncate', s.completed && 'text-fg-muted line-through')}>{s.name}</span>
                    <span className="text-fg-muted text-xs" dir="ltr">
                      {s.plannedTime}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <DeletePlanDialog plan={deleting ? plan : null} onClose={() => setDeleting(false)} onDeleted={() => router.push('/plans')} />
        <ReplaceStopDialog plan={plan} stopId={replacingId} onClose={() => setReplacingId(null)} />
        {/* Stays mounted once used, so each step's conversation survives closing the popup */}
        {askTarget && <StepChat target={askTarget} open={askOpen} onClose={() => setAskOpen(false)} />}
      </div>
    </div>
  );
}

/** "Ask {character}" about one step: the shared chat popup with that place or pavilion as context. */
function StepChat({ target, open, onClose }: { target: DockTarget; open: boolean; onClose: () => void }) {
  const dock = useDockTarget(target);
  return <ChatDock open={open} onClose={onClose} {...dock} />;
}
