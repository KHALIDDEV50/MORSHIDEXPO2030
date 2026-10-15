'use client';

import {
  ArrowLeftRight,
  Baby,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  Crosshair,
  Flag,
  Info,
  Landmark,
  Lightbulb,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  Sun,
  Ticket,
  Trash2,
  Trees,
  TriangleAlert,
  UtensilsCrossed,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { canRemove, type DerivedStop } from '@/entities/plan';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, DemoBadge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, RouteMarkerVisual } from '@/shared/ui';
import type { TripItem } from '../model/use-plan-trip';

type Step = DerivedStop<TripItem>;

type Props = {
  steps: Step[];
  selectedId: string | null;
  expandedIds: ReadonlySet<string>;
  onToggleExpanded: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onAsk: (step: Step) => void;
  onReplace: (step: Step) => void;
  onShowOnMap: (id: string) => void;
  onSetCurrent: (id: string) => void;
  onRemove: (id: string) => void;
};

/**
 * The itinerary as a guided sequence (PRD §4.4): numbered step cards with time, place, short
 * description and key facts; "View details" expands context, what to look for, visit info and
 * practical advice inline (never navigates). Each step can be discussed with the companion,
 * replaced with a suitable alternative, marked done or removed.
 */
export function ItinerarySteps({ steps, selectedId, expandedIds, onToggleExpanded, onToggleCompleted, onAsk, onReplace, onShowOnMap, onSetCurrent, onRemove }: Props) {
  const t = useTranslations('planSteps');
  return (
    <ol className="flex flex-col" aria-label={t('label')}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const reached = step.completed || step.status === 'current';
        return (
          <li key={step.id} className="relative flex gap-3 sm:gap-4">
            {/* Rail: the marker matches the map; the line links the steps in visit order */}
            <div className="flex w-9 shrink-0 flex-col items-center pt-4 sm:w-10" aria-hidden>
              <RouteMarkerVisual kind={step.kind} status={step.status} number={step.number} size="md" selected={step.id === selectedId} />
              {!isLast && <span className={cn('mt-1 w-[3px] flex-1 rounded-full', reached ? 'bg-cta' : 'bg-border-strong/60')} />}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              {step.kind === 'visit' ? (
                <StepCard
                  step={step}
                  selected={step.id === selectedId}
                  expanded={expandedIds.has(step.id)}
                  onToggleExpanded={() => onToggleExpanded(step.id)}
                  onToggleCompleted={() => onToggleCompleted(step.id)}
                  onAsk={() => onAsk(step)}
                  onReplace={() => onReplace(step)}
                  onShowOnMap={() => onShowOnMap(step.id)}
                  onSetCurrent={() => onSetCurrent(step.id)}
                  onRemove={() => onRemove(step.id)}
                />
              ) : step.kind === 'break' ? (
                <BreakCard step={step} onToggleCompleted={() => onToggleCompleted(step.id)} />
              ) : (
                <EndpointCard step={step} onToggleCompleted={() => onToggleCompleted(step.id)} onAsk={step.resolved ? () => onAsk(step) : undefined} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TimeLine({ step }: { step: Step }) {
  const formatDuration = useFormatDuration();
  return (
    <span className="text-fg-secondary inline-flex flex-wrap items-center gap-x-2 text-sm font-medium tabular-nums">
      <span className="bg-surface-muted text-fg inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold">
        <Clock className="size-3.5" aria-hidden />
        <span dir="ltr">{step.durationMin > 0 ? `${step.plannedTime}–${step.plannedEnd}` : step.plannedTime}</span>
      </span>
      {step.durationMin > 0 && <span>{formatDuration(step.durationMin)}</span>}
    </span>
  );
}

function StatusBadge({ step }: { step: Step }) {
  const t = useTranslations('trip.status');
  if (step.status === 'current') {
    return (
      <Badge tone="pink" className="font-bold">
        <span className="bg-accent-pink size-1.5 rounded-full motion-safe:animate-pulse" />
        {t('current')}
      </Badge>
    );
  }
  if (step.status === 'overdue') return <Badge tone="warning">{t('overdue')}</Badge>;
  if (step.status === 'completed') return <Badge tone="success">{t('completed')}</Badge>;
  return null;
}

/** A break between stops (e.g. lunch, P-028): a dashed pink row with its time, status and Done. */
function BreakCard({ step, onToggleCompleted }: { step: Step; onToggleCompleted: () => void }) {
  const t = useTranslations('planSteps');
  const tt = useTranslations('trip.status');
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-dashed px-4 py-3', step.completed ? 'border-border bg-surface-muted/60' : 'border-accent-pink/30 bg-pink-tint/40')}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="type-caption text-accent-pink inline-flex items-center gap-1.5 font-bold">
          <UtensilsCrossed className="size-3.5" aria-hidden />
          {tt('break')}
        </span>
        <span className="text-[0.9375rem] font-bold" dir="auto">
          {step.name}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <TimeLine step={step} />
          <StatusBadge step={step} />
        </span>
      </div>
      <Button size="sm" variant={step.completed ? 'secondary' : 'ghost'} onClick={onToggleCompleted} aria-pressed={step.completed}>
        {step.completed ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
        {step.completed ? t('undoDone') : t('markDone')}
      </Button>
    </div>
  );
}

/** Start point / final destination: a lighter row (not a numbered stop). */
function EndpointCard({ step, onToggleCompleted, onAsk }: { step: Step; onToggleCompleted: () => void; onAsk?: () => void }) {
  const t = useTranslations('planSteps');
  const tt = useTranslations('trip.status');
  const isStart = step.kind === 'start';
  return (
    <div className="border-border bg-surface-muted/60 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-dashed px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-caption text-fg-muted inline-flex items-center gap-1.5 font-bold">
          {isStart ? <MapPin className="size-3.5" aria-hidden /> : <Flag className="size-3.5" aria-hidden />}
          {isStart ? (step.completed ? tt('departed') : tt('start')) : tt('destination')}
          <span dir="ltr" className="font-medium tabular-nums">
            · {step.plannedTime}
          </span>
        </span>
        <span className="text-[0.9375rem] font-bold" dir="auto">
          {step.name}
        </span>
        {step.area && <span className="type-caption text-fg-muted">{step.area}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {onAsk && (
          <Button size="sm" variant="ghost" onClick={onAsk}>
            {t('askShort')}
          </Button>
        )}
        {!isStart && (
          <Button size="sm" variant={step.completed ? 'secondary' : 'ghost'} onClick={onToggleCompleted} aria-pressed={step.completed}>
            {step.completed ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
            {step.completed ? t('undoArrived') : t('arrived')}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepCard({
  step,
  selected,
  expanded,
  onToggleExpanded,
  onToggleCompleted,
  onAsk,
  onReplace,
  onShowOnMap,
  onSetCurrent,
  onRemove,
}: {
  step: Step;
  selected: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleCompleted: () => void;
  onAsk: () => void;
  onReplace: () => void;
  onShowOnMap: () => void;
  onSetCurrent: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations('planSteps');
  const tc = useTranslations('characters');
  const [character] = useActiveCharacter();
  const r = step.resolved;
  const panelId = `step-details-${step.id}`;
  const facts = useFacts(step);

  return (
    <article
      aria-labelledby={`step-title-${step.id}`}
      className={cn(
        'bg-surface flex flex-col rounded-2xl border shadow-xs transition-[border-color,box-shadow]',
        selected ? 'border-primary/50 ring-primary/15 ring-4' : 'border-border',
        step.status === 'current' && !selected && 'border-accent-pink/40',
        step.status === 'overdue' && !selected && 'border-warning/50',
      )}
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TimeLine step={step} />
          <StatusBadge step={step} />
        </div>

        <div className="flex flex-col gap-1">
          {r && (
            <span className="type-caption text-primary font-bold">
              {t('stepOf', { n: step.number ?? 0 })} · {r.categoryLabel}
            </span>
          )}
          <h3 id={`step-title-${step.id}`} className={cn('type-h4', step.completed && 'text-fg-secondary')} dir="auto">
            {step.name}
          </h3>
          {step.area && (
            <span className="type-body-sm text-fg-muted inline-flex items-center gap-1 font-normal">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {step.area}
            </span>
          )}
        </div>

        {step.description && (
          <p className="type-body text-fg-secondary line-clamp-2" dir="auto">
            {step.description}
          </p>
        )}

        {facts.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t('factsLabel')}>
            {facts.slice(0, 4).map((f) => (
              <li key={f.key}>
                <Badge tone="neutral" className="[&_svg]:size-3.5">
                  {f.icon}
                  {f.short}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={onToggleExpanded} aria-expanded={expanded} aria-controls={panelId}>
            {expanded ? t('hideDetails') : t('viewDetails')}
            <ChevronDown className={cn('transition-transform duration-200', expanded && 'rotate-180')} aria-hidden />
          </Button>
          {r && (
            <Button size="sm" variant="ghost" onClick={onAsk}>
              <CharacterAvatar id={character} size="xs" ring={false} decorative />
              {t('ask', { name: tc(`${character}.name`) })}
            </Button>
          )}
          {!step.completed && r && (
            <Button size="sm" variant="ghost" onClick={onReplace}>
              <ArrowLeftRight aria-hidden />
              {t('replace')}
            </Button>
          )}
          <span className="ms-auto flex items-center gap-1">
            <Button size="sm" variant={step.completed ? 'secondary' : 'primary'} onClick={onToggleCompleted} aria-pressed={step.completed}>
              {step.completed ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
              {step.completed ? t('undoDone') : t('markDone')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t('moreFor', { name: step.name })}
                  className="focus-ring text-fg-muted hover:text-fg hover:bg-surface-muted grid size-9 cursor-pointer place-items-center rounded-md"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onShowOnMap}>
                  <MapPin aria-hidden />
                  {t('showOnMap')}
                </DropdownMenuItem>
                {!step.completed && step.status !== 'current' && (
                  <DropdownMenuItem onSelect={onSetCurrent}>
                    <Crosshair aria-hidden />
                    {t('setCurrent')}
                  </DropdownMenuItem>
                )}
                {canRemove(step) && (
                  <DropdownMenuItem onSelect={onRemove} className="text-error-fg">
                    <Trash2 aria-hidden />
                    {t('remove')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </div>
      </div>

      {expanded && (
        <div id={panelId} className="border-border animate-fade-in flex flex-col gap-4 border-t p-4 sm:p-5">
          <StepDetails step={step} facts={facts} />
        </div>
      )}
    </article>
  );
}

type Fact = { key: string; icon: ReactNode; label: string; value: string; short: string };

/** Key facts from the guide data (nothing invented): duration, best time, setting, entry, family. */
function useFacts(step: Step): Fact[] {
  const t = useTranslations('planSteps');
  const tp = useTranslations('placeDetails');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const r = step.resolved;
  const facts: Fact[] = [{ key: 'duration', icon: <Clock />, label: t('visitDuration'), value: formatDuration(step.durationMin), short: formatDuration(step.durationMin) }];
  if (r?.kind === 'place') {
    const { place } = r;
    if (place.bestTime) {
      const best = localize(place.bestTime, locale);
      facts.push({ key: 'best', icon: <Sun />, label: tp('bestTime'), value: best, short: best });
    }
    const setting = place.attributes.indoor ? tp('indoor') : tp('outdoor');
    facts.push({ key: 'setting', icon: place.attributes.indoor ? <Building2 /> : <Trees />, label: tp('setting'), value: setting, short: setting });
    if (place.attributes.freeEntry) facts.push({ key: 'entry', icon: <Ticket />, label: tp('entry'), value: tp('freeEntry'), short: tp('freeEntry') });
    if (place.attributes.familyFriendly) facts.push({ key: 'family', icon: <Baby />, label: tp('family'), value: tp('familyYes'), short: t('familyShort') });
  }
  if (r?.kind === 'booth') {
    facts.push({ key: 'category', icon: <Landmark />, label: t('category'), value: r.categoryLabel, short: r.categoryLabel });
  }
  return facts;
}

function DetailBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h4 className="flex items-center gap-2 text-sm font-bold">
        <span className="text-primary [&_svg]:size-4" aria-hidden>
          {icon}
        </span>
        {title}
      </h4>
      {children}
    </section>
  );
}

function StepDetails({ step, facts }: { step: Step; facts: Fact[] }) {
  const t = useTranslations('planSteps');
  const tt = useTranslations('trip.timeline');
  const locale = useLocale();
  const r = step.resolved;
  if (!r) return <p className="type-body-sm text-fg-muted">{t('noDetails')}</p>;

  const advice: string[] = [];
  if (r.kind === 'place') {
    const { place } = r;
    advice.push(place.attributes.indoor ? t('advice.indoor') : t('advice.outdoor'));
    if (place.openingHours?.provenance === 'demo') advice.push(t('advice.verifyHours'));
    if (place.region.regionCode === 'saudi') advice.push(t('advice.beyondRiyadh'));
  } else {
    advice.push(t('advice.expoLayout'));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        {step.status === 'overdue' && (
          <p className="text-warning-fg flex items-start gap-2 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {tt('overdueExplain', { time: step.plannedEnd })}
          </p>
        )}
        {r.kind === 'place' ? (
          <>
            <DetailBlock icon={<Landmark />} title={r.place.history ? t('history') : t('about')}>
              <p className="type-body-sm text-fg-secondary font-normal" dir="auto">
                {localize(r.place.history ?? r.place.description, locale)}
              </p>
            </DetailBlock>
            {r.place.tips.length > 0 && (
              <DetailBlock icon={<Lightbulb />} title={t('lookFor')}>
                <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal" dir="auto">
                  {r.place.tips.map((tip, i) => (
                    <li key={i}>{localize(tip, locale)}</li>
                  ))}
                </ul>
              </DetailBlock>
            )}
          </>
        ) : (
          <>
            <DetailBlock icon={<Landmark />} title={t('about')}>
              <p className="type-body-sm text-fg-secondary font-normal" dir="auto">
                {localize(r.booth.description, locale)}
              </p>
            </DetailBlock>
            {r.booth.activities.length > 0 && (
              <DetailBlock icon={<CalendarClock />} title={t('activities')}>
                <ul className="type-body-sm text-fg-secondary flex flex-col gap-1 font-normal">
                  {r.booth.activities.map((a, i) => (
                    <li key={i}>
                      {localize(a.title, locale)}
                      {a.time && (
                        <span className="text-fg-muted">
                          {' '}
                          · <span dir="ltr">{a.time}</span> ({t('demoTime')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </DetailBlock>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <DetailBlock icon={<Info />} title={t('visitInfo')}>
          <dl className="border-border bg-surface-muted/50 flex flex-col divide-y divide-[var(--border)] rounded-xl border">
            {facts.map((f) => (
              <div key={f.key} className="flex items-center gap-3 px-3 py-2">
                <span className="text-fg-muted [&_svg]:size-4" aria-hidden>
                  {f.icon}
                </span>
                <dt className="text-fg-secondary flex-1 text-sm">{f.label}</dt>
                <dd className="text-end text-sm font-bold">{f.value}</dd>
              </div>
            ))}
            {r.kind === 'place' && r.place.openingHours && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <span className="text-fg-muted" aria-hidden>
                  <CalendarClock className="size-4" />
                </span>
                <dt className="text-fg-secondary flex-1 text-sm">{t('hours')}</dt>
                <dd className="flex items-center gap-2 text-sm font-bold">
                  <span dir="auto">{localize(r.place.openingHours.text, locale)}</span>
                  {r.place.openingHours.provenance === 'demo' && <DemoBadge label={t('hoursDemo')} />}
                </dd>
              </div>
            )}
          </dl>
        </DetailBlock>
        <DetailBlock icon={<Lightbulb />} title={t('practical')}>
          <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal">
            {advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </DetailBlock>
      </div>
    </div>
  );
}
