'use client';

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Bot, GripVertical, Lock, Plus, Search, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useActiveCharacter } from '@/entities/ai-character';
import { useBoothSearch } from '@/entities/expo';
import { usePlaceSearch } from '@/entities/place';
import { planKeys, planRepository, scheduleStops, usePlanCount, type Plan, type PlanStopRef } from '@/entities/plan';
import { canSavePlan, useSubscriptionSnapshot } from '@/entities/subscription';
import { canFinalize, EMPTY_FORM, formToPlanInput, hasRef, PlanFormSchema, planToForm, type PlanFormValues } from '@/features/edit-plan';
import { useStopRefs } from '@/features/send-chat-message';
import { localize } from '@/shared/api';
import { Link, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { requestSignIn } from '@/shared/lib/auth-gate';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, Input, Label, SegmentedControl, toast } from '@/shared/ui';

type Props = {
  /** Editing an existing plan; omitted for a new plan */
  plan?: Plan;
  /** New plan: preselected type and an optional first stop (e.g. from Discover / Expo) */
  initialType?: 'tourism' | 'expo';
  initialStop?: PlanStopRef;
};

const FIELD_ERROR = 'type-caption text-error-fg';

/**
 * Plan editor (PRD §4.4, Screen 12): name, type, date, start time; stops added from search,
 * reordered by drag or keyboard buttons, durations and times editable; summary; Save draft / Save.
 * Validation: React Hook Form + Zod. Tourism and Expo stops are never mixed.
 */
export function PlanEditor({ plan, initialType, initialStop }: Props) {
  const t = useTranslations('planEditor');
  const tc = useTranslations('characters');
  const router = useRouter();
  const queryClient = useQueryClient();
  const formatDuration = useFormatDuration();
  const { resolve } = useStopRefs();
  const [character] = useActiveCharacter();
  const { subscription } = useSubscriptionSnapshot();
  // Saved-plan limit (P-012) against the real number of plans
  const createCheck = canSavePlan(subscription, usePlanCount());
  const ids = { name: useId(), date: useId(), time: useId() };

  const defaults = useMemo<PlanFormValues>(() => {
    if (plan) return planToForm(plan);
    const type = initialType ?? (initialStop?.kind === 'booth' ? 'expo' : 'tourism');
    return { ...EMPTY_FORM, type, stops: initialStop ? [{ ref: initialStop, durationMin: 60, startTime: '' }] : [] };
  }, [plan, initialType, initialStop]);

  const form = useForm<PlanFormValues>({ resolver: zodResolver(PlanFormSchema), defaultValues: defaults, mode: 'onTouched' });
  const { control, register, handleSubmit, formState, setError, clearErrors } = form;
  const stops = useFieldArray({ control, name: 'stops', keyName: 'key' });
  const values = useWatch({ control }) as PlanFormValues;
  const type = values.type ?? 'tourism';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = stops.fields.findIndex((f) => f.key === active.id);
    const to = stops.fields.findIndex((f) => f.key === over.id);
    if (from >= 0 && to >= 0) stops.move(from, to);
  };

  // Planned times and totals for the summary (estimates; buffer between stops)
  const schedule = useMemo(
    () =>
      scheduleStops({
        startTime: values.startTime || undefined,
        stops: (values.stops ?? []).map((s, i) => ({ id: String(i), order: i, ref: s.ref, durationMin: Number(s.durationMin) || 0, startTime: s.startTime || undefined })),
      }),
    [values.startTime, values.stops],
  );
  const totalMinutes = (values.stops ?? []).reduce((sum, s) => sum + (Number(s.durationMin) || 0), 0);

  const save = useMutation({
    mutationFn: async ({ data, isDraft }: { data: PlanFormValues; isDraft: boolean }) => {
      const input = formToPlanInput(data, isDraft);
      if (plan) return planRepository.update(plan.id, input);
      return planRepository.create({ ...input, stops: input.stops.map((s) => ({ ref: s.ref, durationMin: s.durationMin, startTime: s.startTime, completedAt: null })) });
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      toast.success(t('savedToast', { name: saved.name }));
      router.push(`/plans/${saved.id}`);
    },
    onError: () => toast.error(t('errorToast')),
  });

  const guest = subscription === null;
  const submit = (isDraft: boolean) =>
    handleSubmit(async (data) => {
      // Guests sign in first, then the save completes (PRD §4.7)
      if (guest && !(await requestSignIn())) return;
      if (!plan && !guest && !createCheck.allowed) return; // explained next to the buttons
      if (!isDraft && !canFinalize(data)) {
        setError('stops', { message: 'stopsRequired' });
        return;
      }
      save.mutate({ data, isDraft });
    });

  const errorText = (message?: string) => (message ? t(`errors.${message}` as 'errors.nameRequired') : null);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false)();
      }}
      className="flex flex-col gap-6"
    >
      <section aria-labelledby="editor-details" className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-4 shadow-xs sm:p-6">
        <SectionHeading id="editor-details" step={1} title={t('sections.details')} hint={t('sections.detailsHint')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={ids.name}>{t('name')}</Label>
            <Input id={ids.name} {...register('name')} dir="auto" maxLength={80} aria-invalid={Boolean(formState.errors.name)} aria-describedby={`${ids.name}-err`} />
            <span id={`${ids.name}-err`} className={FIELD_ERROR} role="alert">
              {errorText(formState.errors.name?.message)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t('type')}</span>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <SegmentedControl
                  label={t('type')}
                  value={field.value}
                  onValueChange={(v) => {
                    // Never mix: switching type needs an empty stop list
                    if ((values.stops ?? []).length > 0) {
                      toast(t('typeLocked'));
                      return;
                    }
                    field.onChange(v);
                  }}
                  options={[
                    { value: 'tourism', label: t('types.tourism') },
                    { value: 'expo', label: t('types.expo') },
                  ]}
                />
              )}
            />
            {(values.stops ?? []).length > 0 && (
              <span className="type-caption text-fg-muted inline-flex items-center gap-1">
                <Lock className="size-3" aria-hidden />
                {t('typeLockedHint')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.date}>{t('date')}</Label>
              <Input id={ids.date} type="date" {...register('date')} aria-invalid={Boolean(formState.errors.date)} />
              <span className={FIELD_ERROR}>{errorText(formState.errors.date?.message)}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.time}>{t('startTime')}</Label>
              <Input id={ids.time} type="time" {...register('startTime')} aria-invalid={Boolean(formState.errors.startTime)} />
              <span className={FIELD_ERROR}>{errorText(formState.errors.startTime?.message)}</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="editor-stops" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-4 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <SectionHeading id="editor-stops" step={2} title={t('stops')} hint={t('sections.stopsHint')} />
          <p className="type-body-sm text-fg-secondary bg-surface-muted rounded-full px-3 py-1 font-normal" aria-live="polite">
            {t('summary', { count: stops.fields.length, duration: formatDuration(totalMinutes) })}
            {schedule.length > 0 && values.startTime && (
              <span dir="ltr">
                {' '}
                · {schedule[0]}–{lastEnd(schedule, values)}
              </span>
            )}
          </p>
        </div>
        <span className={FIELD_ERROR} role="alert">
          {errorText(formState.errors.stops?.message ?? formState.errors.stops?.root?.message)}
        </span>

        {stops.fields.length === 0 ? (
          <p className="border-border text-fg-muted rounded-xl border border-dashed p-6 text-center text-sm">{t('noStops')}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={stops.fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
              <ol className="flex flex-col gap-2" aria-label={t('stops')}>
                {stops.fields.map((field, index) => {
                  const stop = resolve(field.ref);
                  const name = stop ? (stop.kind === 'booth' ? `${stop.number} · ${stop.name}` : stop.name) : t('unknownStop');
                  return (
                    <SortableStop key={field.key} id={field.key} dragLabel={t('dragHandle', { name })}>
                      <span className="bg-primary-tint text-primary grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums">{index + 1}</span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-bold">{name}</span>
                          {field.completedAt && <Badge tone="success">{t('done')}</Badge>}
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="text-fg-secondary">{t('duration')}</span>
                            <Input type="number" min={5} max={720} step={5} className="w-24" {...register(`stops.${index}.durationMin`, { valueAsNumber: true })} />
                          </label>
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="text-fg-secondary">{t('stopTime')}</span>
                            <Input type="time" className="w-32" {...register(`stops.${index}.startTime`)} />
                          </label>
                          <span className="type-caption text-fg-muted pb-2" dir="ltr">
                            ≈ {schedule[index]}
                          </span>
                        </div>
                        <span className={FIELD_ERROR}>
                          {errorText(formState.errors.stops?.[index]?.durationMin?.message ?? formState.errors.stops?.[index]?.startTime?.message)}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={t('moveUp', { name })} disabled={index === 0} onClick={() => stops.move(index, index - 1)}>
                          <ArrowUp aria-hidden />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={t('moveDown', { name })} disabled={index === stops.fields.length - 1} onClick={() => stops.move(index, index + 1)}>
                          <ArrowDown aria-hidden />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" className="text-error-fg" aria-label={t('remove', { name })} onClick={() => stops.remove(index)}>
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </SortableStop>
                  );
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}

        <AddStopPanel
          type={type}
          exclude={(values.stops ?? []).map((s) => s.ref)}
          onAdd={(ref, durationMin) => {
            if (hasRef(values.stops ?? [], ref)) return;
            stops.append({ ref, durationMin, startTime: '' });
            clearErrors('stops');
          }}
        />
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/chat?planner=1">
            <Bot aria-hidden />
            {t('generateWith', { name: tc(`${character}.name`) })}
          </Link>
        </Button>
      </section>

      <div className="border-border bg-page/95 sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-col gap-2 border-t px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:bottom-0">
        <p className="type-caption text-fg-muted hidden sm:block">{t('sections.saveHint')}</p>
        {!plan && !guest && !createCheck.allowed && (
          <p className="type-caption text-warning-fg" role="status">
            {createCheck.reason === 'sign_in_required' ? t('signInRequired') : t('limitReached')}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="button" variant="secondary" loading={save.isPending && save.variables?.isDraft} disabled={save.isPending || (!plan && !guest && !createCheck.allowed)} onClick={() => void submit(true)()}>
            {t('saveDraft')}
          </Button>
          <Button type="submit" loading={save.isPending && !save.variables?.isDraft} disabled={save.isPending || (!plan && !guest && !createCheck.allowed)}>
            {t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Numbered section title: the form reads as 1 · details → 2 · stops → save. */
function SectionHeading({ id, step, title, hint }: { id: string; step: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-cta text-on-cta grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums" aria-hidden>
        {step}
      </span>
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="type-h3">
          {title}
        </h2>
        <p className="type-body-sm text-fg-secondary font-normal">{hint}</p>
      </div>
    </div>
  );
}

function lastEnd(schedule: string[], values: PlanFormValues): string {
  const last = values.stops.at(-1);
  const start = schedule.at(-1);
  if (!last || !start) return '';
  const [h = 0, m = 0] = start.split(':').map(Number);
  const end = h * 60 + m + (Number(last.durationMin) || 0);
  return `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
}

/** One sortable row: drag handle (pointer + keyboard via dnd-kit) and the row content. */
function SortableStop({ id, dragLabel, children }: { id: string; dragLabel: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('border-border bg-surface flex items-start gap-3 rounded-xl border p-3', isDragging && 'border-primary relative z-10 shadow-lg')}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={dragLabel}
        className="focus-ring text-fg-muted hover:text-fg mt-1 grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      {children}
    </li>
  );
}

/** Add stops from the guide (places) or the Expo layout (booths), matching the plan type. */
function AddStopPanel({ type, exclude, onAdd }: { type: 'tourism' | 'expo'; exclude: PlanStopRef[]; onAdd: (ref: PlanStopRef, durationMin: number) => void }) {
  const t = useTranslations('planEditor');
  const locale = useLocale();
  const [q, setQ] = useState('');
  const places = usePlaceSearch({ locale, q: q || undefined, pageSize: 8 });
  const booths = useBoothSearch({ q: q || undefined });
  const excluded = new Set(exclude.map((r) => (r.kind === 'place' ? r.placeId : r.boothId)));
  const results =
    type === 'tourism'
      ? (places.data?.items ?? []).map((p) => ({ id: p.id, name: localize(p.name, locale), duration: p.suggestedDurationMin, ref: { kind: 'place' as const, placeId: p.id } }))
      : (booths.data ?? []).slice(0, 8).map((b) => ({ id: b.id, name: `${b.number} · ${localize(b.name, locale)}`, duration: b.suggestedDurationMin, ref: { kind: 'booth' as const, boothId: b.id } }));
  const searchId = useId();

  return (
    <div className="border-border flex flex-col gap-2 rounded-xl border border-dashed p-3">
      <label htmlFor={searchId} className="flex items-center gap-2 text-sm font-bold">
        <Search className="text-fg-muted size-4" aria-hidden />
        {type === 'tourism' ? t('addPlace') : t('addBooth')}
      </label>
      <Input id={searchId} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} />
      <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto" aria-label={t('searchResults')}>
        {results.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
            <span className="min-w-0 truncate text-sm">{r.name}</span>
            <Button type="button" size="sm" variant="secondary" disabled={excluded.has(r.id)} onClick={() => onAdd(r.ref, r.duration)}>
              <Plus aria-hidden />
              {excluded.has(r.id) ? t('added') : t('add')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
