'use client';

import { ArrowRight, Bot, CalendarDays, Clock, Copy, MapPin, MoreHorizontal, Pencil, Plus, Route, SearchX, Trash2, Eye, ListChecks, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Suspense, useRef, useState } from 'react';
import { useActiveCharacter } from '@/entities/ai-character';
import { CATEGORY_ICON, CATEGORY_TONE, PlacePhoto, placePhoto } from '@/entities/place';
import { PLAN_TABS, planProgress, planStatus, sortedStops, totalDurationMin, useFeaturedPlans, usePlans, type Plan, type PlanStatus, type PlanTab } from '@/entities/plan';
import { DeletePlanDialog, usePlanActions } from '@/features/manage-plan';
import { useStopRefs } from '@/features/send-chat-message';
import { localize } from '@/shared/api';
import { Link, usePathname, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import {
  Badge,
  Button,
  CardSkeleton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Pagination,
  SearchField,
  Skeleton,
  TabsList,
  TabsTrigger,
  Tabs,
} from '@/shared/ui';

/** 3 × 3 on wide screens */
const PAGE_SIZE = 9;

export const STATUS_TONE: Record<PlanStatus, 'neutral' | 'primary' | 'pink' | 'success'> = {
  draft: 'neutral',
  upcoming: 'primary',
  in_progress: 'pink',
  completed: 'success',
};

export function PlansPageView() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 rounded-xl" />}>
      <PlansPage />
    </Suspense>
  );
}

/** My Plans overview (PRD §4.4, Screen 11): featured (copyable), tabs, search, list / cards, pagination. */
function PlansPage() {
  const t = useTranslations('plansPage');
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tab = (PLAN_TABS as readonly string[]).includes(search.get('tab') ?? '') ? (search.get('tab') as PlanTab) : 'all';
  const q = search.get('q') ?? '';
  const page = Math.max(1, Number(search.get('page')) || 1);
  const plans = usePlans({ tab, q, page, pageSize: PAGE_SIZE });
  const [deleting, setDeleting] = useState<Plan | null>(null);
  /** Bumped by "Clear search" so the search box resets (typing never remounts it) */
  const [searchReset, setSearchReset] = useState(0);

  const setParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || (k === 'tab' && v === 'all') || (k === 'page' && v === 1)) next.delete(k);
      else next.set(k, String(v));
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const items = plans.data?.items ?? [];
  const totalPages = plans.data ? Math.ceil(plans.data.total / PAGE_SIZE) : 1;

  return (
    <div className="bg-page flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="type-h1">{t('title')}</h1>
            <p className="type-body text-fg-secondary">{t('subtitle')}</p>
          </div>
          <Button asChild variant="gradient">
            <Link href="/plans/new">
              <Plus aria-hidden />
              {t('newPlan')}
            </Link>
          </Button>
        </header>

        <FeaturedPlans />

        <section aria-labelledby="my-plans-title" className="flex flex-col gap-4">
          <h2 id="my-plans-title" className="sr-only">
            {t('listTitle')}
          </h2>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={tab} onValueChange={(v) => setParams({ tab: v, page: 1 })}>
              <TabsList aria-label={t('tabsLabel')} className="max-w-full overflow-x-auto">
                {PLAN_TABS.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {t(`tabs.${key}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <PlanSearch key={searchReset} initial={q} onSearch={(v) => setParams({ q: v, page: 1 })} />
          </div>

          {plans.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : plans.isError ? (
            <ErrorState error={plans.error} onRetry={() => void plans.refetch()} className="border-border rounded-xl border" />
          ) : items.length === 0 ? (
            q ? (
              <div className="border-border bg-surface rounded-2xl border">
                <EmptyState
                  icon={<SearchX />}
                  title={t('noResults')}
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchReset((k) => k + 1);
                        setParams({ q: null });
                      }}
                    >
                      {t('clearSearch')}
                    </Button>
                  }
                />
              </div>
            ) : (
              <PlansEmpty title={t(`empty.${tab}`)} />
            )
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {items.map((plan) => (
                  <li key={plan.id}>
                    <PlanCard plan={plan} onDelete={setDeleting} />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setParams({ page: p })} className="self-center" />
            </>
          )}
        </section>

        <DeletePlanDialog plan={deleting} onClose={() => setDeleting(null)} />
      </div>
    </div>
  );
}

/** No plans yet: what plans are for and three ways to start one. */
function PlansEmpty({ title }: { title: string }) {
  const t = useTranslations('plansPage');
  const tc = useTranslations('characters');
  const [character] = useActiveCharacter();
  return (
    <div className="border-primary/20 bg-surface-brand flex flex-col items-center gap-4 rounded-2xl border px-6 py-12 text-center">
      <span className="bg-cta text-on-cta shadow-glow grid size-16 place-items-center rounded-2xl" aria-hidden>
        <Route className="size-7" />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h3 className="type-h3">{title}</h3>
        <p className="type-body text-fg-secondary">{t('emptyHint')}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="gradient">
          <Link href="/plans/new">
            <Plus aria-hidden />
            {t('newPlan')}
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/chat?planner=1">
            <Bot aria-hidden />
            {t('askCharacter', { name: tc(`${character}.name`) })}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Search box with local state; the URL updates after a short pause (no dropped keystrokes). */
function PlanSearch({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const t = useTranslations('plansPage');
  const [text, setText] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <div className="lg:w-72">
      <SearchField
        label={t('search')}
        placeholder={t('search')}
        value={text}
        onValueChange={(v) => {
          setText(v);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => onSearch(v), v ? 250 : 0);
        }}
      />
    </div>
  );
}

function usePlanMeta(plan: Plan) {
  const t = useTranslations('plansPage');
  const format = useFormatter();
  const formatDuration = useFormatDuration();
  const status = planStatus(plan);
  const progress = planProgress(plan);
  const date = plan.date ? format.dateTime(new Date(`${plan.date}T00:00:00`), { weekday: 'short', day: 'numeric', month: 'short' }) : t('noDate');
  return { status, progress, date, duration: formatDuration(totalDurationMin(plan)) };
}

function StatusBadge({ status, progress }: { status: PlanStatus; progress: { completed: number; total: number } }) {
  const t = useTranslations('plansPage');
  return (
    <Badge tone={STATUS_TONE[status]}>
      {t(`status.${status}`)}
      {status === 'in_progress' && <span className="tabular-nums"> · {t('progressShort', { completed: progress.completed, total: progress.total })}</span>}
    </Badge>
  );
}

function PlanMenu({ plan, onDelete }: { plan: Plan; onDelete: (plan: Plan) => void }) {
  const t = useTranslations('plansPage');
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t('actionsFor', { name: plan.name })} className="focus-ring text-fg-muted hover:text-fg hover:bg-surface-muted grid size-9 cursor-pointer place-items-center rounded-md">
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => router.push(`/plans/${plan.id}`)}>
          <Eye aria-hidden />
          {t('open')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`/plans/${plan.id}/edit`)}>
          <Pencil aria-hidden />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDelete(plan)} className="text-error-fg">
          <Trash2 aria-hidden />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Cover, first → last stop and stop count, from the plan's own stops (no invented imagery). */
function usePlanCover(plan: Plan) {
  const locale = useLocale();
  const { resolve } = useStopRefs();
  const stops = sortedStops(plan)
    .map((s) => resolve(s.ref))
    .filter((r) => r !== null);
  const first = stops[0];
  const last = stops.at(-1);
  const name = (r: NonNullable<typeof first>) => (r.kind === 'booth' ? `${r.number} · ${r.name}` : r.name);
  const category = first?.kind === 'place' ? first.place.categories[0] : undefined;
  return {
    tone: plan.type === 'expo' ? ('expo' as const) : category ? CATEGORY_TONE[category] : ('brand' as const),
    icon: category ? CATEGORY_ICON[category] : undefined,
    photo: first?.kind === 'place' ? placePhoto(first.place, locale) : undefined,
    from: first ? name(first) : null,
    to: last && last !== first ? name(last) : null,
    more: Math.max(0, stops.length - 2),
  };
}

function PlanCard({ plan, onDelete }: { plan: Plan; onDelete: (plan: Plan) => void }) {
  const t = useTranslations('plansPage');
  const meta = usePlanMeta(plan);
  const cover = usePlanCover(plan);
  return (
    <article className="group border-border bg-surface relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-xs transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0">
      <div className="relative">
        <PlacePhoto photo={cover.photo} label={plan.name} tone={cover.tone} icon={cover.icon} captionPlacement="top" className="aspect-[16/9] w-full" />
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
          <StatusBadge status={meta.status} progress={meta.progress} />
          <Badge tone={plan.type === 'expo' ? 'roaya' : 'arif'}>{t(`type.${plan.type}`)}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="type-h4 min-w-0">
            <Link href={`/plans/${plan.id}`} className="focus-ring rounded-sm after:absolute after:inset-0 after:content-['']" dir="auto">
              {plan.name}
            </Link>
          </h3>
          <div className="relative z-10 -me-2 -mt-1">
            <PlanMenu plan={plan} onDelete={onDelete} />
          </div>
        </div>

        {cover.from && (
          <p className="type-body-sm text-fg-secondary flex min-w-0 items-center gap-1.5 font-normal">
            <MapPin className="text-primary size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {cover.from}
              {cover.to && (
                <>
                  {' '}
                  <ArrowRight className="flip-rtl inline size-3.5 align-[-2px]" aria-label={t('to')} /> {cover.to}
                </>
              )}
            </span>
            {cover.more > 0 && <span className="text-fg-muted shrink-0">{t('moreStops', { count: cover.more })}</span>}
          </p>
        )}

        <ul className="type-caption text-fg-secondary mt-auto flex flex-wrap gap-x-4 gap-y-1.5">
          <li className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden />
            {meta.date}
            {plan.startTime && (
              <span dir="ltr" className="text-fg-muted">
                · {plan.startTime}
              </span>
            )}
          </li>
          <li className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {meta.duration}
          </li>
          <li className="inline-flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden />
            {t('stopsCount', { count: plan.stops.length })}
          </li>
        </ul>

        {meta.status === 'in_progress' && (
          <div className="flex items-center gap-2">
            <div className="bg-surface-muted h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden>
              <div className="bg-cta h-full rounded-full" style={{ width: `${Math.round(meta.progress.ratio * 100)}%` }} />
            </div>
            <span className="type-caption text-fg-muted tabular-nums">{t('progressShort', { completed: meta.progress.completed, total: meta.progress.total })}</span>
          </div>
        )}
      </div>
    </article>
  );
}

/** Curated ready-made plans users can copy into their own plans (PRD §4.4). */
function FeaturedPlans() {
  const t = useTranslations('plansPage');
  const locale = useLocale();
  const router = useRouter();
  const featured = useFeaturedPlans();
  const { copyFeatured } = usePlanActions();
  const formatDuration = useFormatDuration();

  return (
    <section aria-labelledby="featured-plans-title" className="flex flex-col gap-3">
      <h2 id="featured-plans-title" className="type-h3 flex items-center gap-2">
        <Sparkles className="text-accent-pink size-5" aria-hidden />
        {t('featuredTitle')}
      </h2>
      {featured.isPending ? (
        <div className="flex gap-3 overflow-hidden" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <CardSkeleton key={i} className="w-72 shrink-0" lines={1} />
          ))}
        </div>
      ) : (
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {(featured.data ?? []).map((f) => (
            <li key={f.id} className="w-72 shrink-0 snap-start sm:w-auto">
              <article className="border-border bg-surface-brand flex h-full flex-col gap-2 rounded-xl border p-4">
                <Badge tone={f.type === 'expo' ? 'roaya' : 'arif'} className="w-fit">
                  {t(`type.${f.type}`)}
                </Badge>
                <h3 className="text-base font-bold">{localize(f.name, locale)}</h3>
                <p className="type-body-sm text-fg-secondary flex-1 font-normal">{localize(f.summary, locale)}</p>
                <p className="type-caption text-fg-muted">
                  {t('stopsCount', { count: f.stops.length })} · {formatDuration(f.stops.reduce((sum, s) => sum + s.durationMin, 0))}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={copyFeatured.isPending && copyFeatured.variables?.featuredId === f.id}
                  className={cn('mt-1 w-fit')}
                  onClick={() =>
                    copyFeatured.mutate(
                      { featuredId: f.id, locale },
                      // The copy is a draft: open the editor to pick a date
                      { onSuccess: (plan) => router.push(`/plans/${plan.id}/edit`) },
                    )
                  }
                >
                  <Copy aria-hidden />
                  {t('copy')}
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
