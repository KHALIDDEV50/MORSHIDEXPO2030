import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema, LatLngSchema, LocalizedTextSchema, TimeSchema } from '@/shared/api';
import { fromMinutes, toMinutes } from './trip';

/**
 * Saved plan contract (api-contracts.md §2) — one model for tourism and Expo plans (D-016..D-021).
 * Status and progress are DERIVED (selectors below), except `isDraft`.
 * Stop completion is only ever set by the user — never inferred from location (D-019).
 */
export const PlanStopRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('place'), placeId: z.string().startsWith('plc_') }),
  z.object({ kind: z.literal('booth'), boothId: z.string().startsWith('booth_') }),
]);
export type PlanStopRef = z.infer<typeof PlanStopRefSchema>;

export const PlanStopSchema = z.object({
  id: z.string().startsWith('stop_'),
  order: z.number().int().nonnegative(),
  ref: PlanStopRefSchema,
  startTime: TimeSchema.optional(),
  durationMin: z.number().int().positive(),
  objective: LocalizedTextSchema.optional(),
  completedAt: IsoDateTimeSchema.nullable().optional(),
});
export type PlanStop = z.infer<typeof PlanStopSchema>;

/**
 * A rest or meal break inside a plan (P-028), e.g. a lunch break. It follows one stop
 * (`afterStopId`) and moves with it; it is not a place, so it has no map position and no number.
 * Completed manually like a stop (D-019). A break whose stop was removed is ignored.
 */
export const PlanBreakSchema = z.object({
  id: z.string().startsWith('brk_'),
  afterStopId: z.string().startsWith('stop_'),
  label: LocalizedTextSchema,
  /** Planned start; defaults to the end of the stop before it */
  startTime: TimeSchema.optional(),
  durationMin: z.number().int().positive(),
  completedAt: IsoDateTimeSchema.nullable().optional(),
});
export type PlanBreak = z.infer<typeof PlanBreakSchema>;

/**
 * Where a plan starts or ends (shown as the start / end markers and the ends of the route line).
 * Either a guide place / booth, or a named point with a VERIFIED location (D-023) — e.g. a metro
 * station. Endpoints are not numbered stops and are never "completed".
 */
export const PlanEndpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('place'), placeId: z.string().startsWith('plc_') }),
  z.object({ kind: z.literal('booth'), boothId: z.string().startsWith('booth_') }),
  z.object({ kind: z.literal('point'), name: LocalizedTextSchema, location: LatLngSchema, locationSource: z.string().min(1) }),
]);
export type PlanEndpoint = z.infer<typeof PlanEndpointSchema>;

export const PlanTypeSchema = z.enum(['tourism', 'expo']);
export type PlanType = z.infer<typeof PlanTypeSchema>;

export const PlanSchema = z.object({
  id: z.string().startsWith('plan_'),
  ownerId: z.string(),
  /** User-entered name (shown as typed, in any language) */
  name: z.string().min(1).max(80),
  type: PlanTypeSchema,
  date: IsoDateSchema.optional(),
  startTime: TimeSchema.optional(),
  isDraft: z.boolean(),
  /** Optional start and end points around the numbered stops */
  start: PlanEndpointSchema.optional(),
  end: PlanEndpointSchema.optional(),
  /** The visitor marked the end point as reached (manual, like stops — D-019) */
  endCompletedAt: IsoDateTimeSchema.nullable().optional(),
  stops: z.array(PlanStopSchema),
  /** Optional breaks between stops (P-028) */
  breaks: z.array(PlanBreakSchema).optional(),
  startedAt: IsoDateTimeSchema.nullable().optional(),
  sourceProposalId: z.string().optional(),
  coverImage: z.string().optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Plan = z.infer<typeof PlanSchema>;

/** Curated, copyable plans (Plans overview "Featured"). Copying creates a user-owned Plan. */
export const FeaturedPlanSchema = z.object({
  id: z.string().startsWith('feat_'),
  name: LocalizedTextSchema,
  summary: LocalizedTextSchema,
  type: PlanTypeSchema,
  startTime: TimeSchema,
  stops: z.array(PlanStopSchema.omit({ completedAt: true })),
});
export type FeaturedPlan = z.infer<typeof FeaturedPlanSchema>;

/**
 * What saving an AI proposal needs (D-021). The HTTP repository sends only the id + kept stops;
 * the demo repository builds the plan from it. Saving is idempotent per `proposalId`.
 */
export const ProposalToSaveSchema = z.object({
  proposalId: z.string().startsWith('prop_'),
  name: z.string().min(1),
  type: PlanTypeSchema,
  date: IsoDateSchema.optional(),
  startTime: TimeSchema,
  stops: z.array(z.object({ ref: PlanStopRefSchema, durationMin: z.number().int().positive(), startTime: TimeSchema.optional(), objective: LocalizedTextSchema.optional() })),
});
export type ProposalToSave = z.infer<typeof ProposalToSaveSchema>;

export const PLAN_TABS = ['all', 'upcoming', 'in_progress', 'completed', 'drafts'] as const;
export type PlanTab = (typeof PLAN_TABS)[number];
export type PlanStatus = 'draft' | 'upcoming' | 'in_progress' | 'completed';

export type PlanListQuery = { tab?: PlanTab; q?: string; page?: number; pageSize?: number };

// ───────────── Selectors (pure) ─────────────

/** Id used for the end point wherever stops are listed (timeline, guided mode, repository). */
export const END_STOP_ID = 'end';

/** Breaks that still follow a stop of the plan (a break whose stop was removed is ignored). */
export function activeBreaks(plan: Pick<Plan, 'stops'> & Partial<Pick<Plan, 'breaks'>>): PlanBreak[] {
  const ids = new Set(plan.stops.map((s) => s.id));
  return (plan.breaks ?? []).filter((b) => ids.has(b.afterStopId));
}

/** Stops, breaks and the end point (when the plan has one) count toward progress; the start never does. */
export function planProgress(plan: Pick<Plan, 'stops'> & Partial<Pick<Plan, 'end' | 'endCompletedAt' | 'breaks'>>): { completed: number; total: number; ratio: number } {
  const hasEnd = Boolean(plan.end);
  const breaks = activeBreaks(plan);
  const total = plan.stops.length + breaks.length + (hasEnd ? 1 : 0);
  const completed = plan.stops.filter((s) => Boolean(s.completedAt)).length + breaks.filter((b) => Boolean(b.completedAt)).length + (hasEnd && plan.endCompletedAt ? 1 : 0);
  return { completed, total, ratio: total === 0 ? 0 : completed / total };
}

/** Stops must match the plan type — tourism places or Expo booths, never mixed (D-012). */
export function stopsMatchType(type: PlanType, refs: PlanStopRef[]): boolean {
  return refs.every((r) => (type === 'expo' ? r.kind === 'booth' : r.kind === 'place'));
}

/**
 * Planned time of each stop (in order): its own startTime when set, otherwise the previous end
 * plus an estimated buffer. Estimates only — never travel-time claims (D-018/D-020).
 */
export function scheduleStops(plan: Pick<Plan, 'startTime' | 'stops'> & Partial<Pick<Plan, 'breaks'>>, bufferMin = 15): string[] {
  const breakAfter = new Map(activeBreaks(plan).map((b) => [b.afterStopId, b]));
  let cursor = toMinutes(plan.startTime ?? '09:00');
  return sortedStops(plan).map((s, i) => {
    if (s.startTime) cursor = toMinutes(s.startTime);
    else if (i > 0) cursor += bufferMin;
    const at = fromMinutes(cursor);
    cursor += s.durationMin;
    // A break after this stop pushes the next (untimed) stop back by its length
    const brk = breakAfter.get(s.id);
    if (brk) cursor = (brk.startTime ? toMinutes(brk.startTime) : cursor) + brk.durationMin;
    return at;
  });
}

/** Planned start of a break: its own time, or the end of the stop it follows. */
export function breakStartTime(brk: PlanBreak, stopTime: string, stopDurationMin: number): string {
  return brk.startTime ?? fromMinutes(toMinutes(stopTime) + stopDurationMin);
}

/** draft → completed (every stop done) → in_progress (started or any stop done) → upcoming. */
export function planStatus(plan: Plan): PlanStatus {
  if (plan.isDraft) return 'draft';
  const { completed, total } = planProgress(plan);
  if (total > 0 && completed === total) return 'completed';
  if (plan.startedAt || completed > 0) return 'in_progress';
  return 'upcoming';
}

export function matchesTab(plan: Plan, tab: PlanTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'drafts') return plan.isDraft;
  return planStatus(plan) === tab;
}

export function totalDurationMin(plan: Pick<Plan, 'stops'>): number {
  return plan.stops.reduce((sum, s) => sum + s.durationMin, 0);
}

/** The stop guided mode should show: first not-completed stop in order. */
export function currentStopId(plan: Plan): string | null {
  return sortedStops(plan).find((s) => !s.completedAt)?.id ?? null;
}

export function sortedStops<P extends Pick<Plan, 'stops'>>(plan: P): P['stops'] {
  return [...plan.stops].sort((a, b) => a.order - b.order);
}

/** Re-number `order` 0..n-1 following the array order. */
export function renumberStops<S extends { order: number }>(stops: S[]): S[] {
  return stops.map((s, i) => (s.order === i ? s : { ...s, order: i }));
}
