import { z } from 'zod';
import { PlanStopRefSchema, stopsMatchType, type Plan, type PlanStopInput } from '@/entities/plan';

/**
 * Plan editor form (PRD §4.4, Screen 12). Messages are translation keys (resolved in the UI).
 * Drafts may be incomplete; "Save" additionally needs at least one stop.
 */
export const StopFieldSchema = z.object({
  /** Existing stops keep their id (and completion) when saved */
  stopId: z.string().optional(),
  ref: PlanStopRefSchema,
  durationMin: z.number({ message: 'durationInvalid' }).int('durationInvalid').min(5, 'durationMin').max(720, 'durationMax'),
  /** Optional fixed start time ("HH:mm"); empty = follows the previous stop */
  startTime: z.union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'timeInvalid')]),
  completedAt: z.string().nullable().optional(),
});

export const PlanFormSchema = z
  .object({
    name: z.string().trim().min(1, 'nameRequired').max(80, 'nameTooLong'),
    type: z.enum(['tourism', 'expo']),
    date: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateInvalid')]),
    startTime: z.union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'timeInvalid')]),
    stops: z.array(StopFieldSchema).max(20, 'tooManyStops'),
  })
  .refine((v) => stopsMatchType(v.type, v.stops.map((s) => s.ref)), { path: ['stops'], message: 'mixedTypes' });

export type PlanFormValues = z.infer<typeof PlanFormSchema>;
export type StopField = z.infer<typeof StopFieldSchema>;

export const EMPTY_FORM: PlanFormValues = { name: '', type: 'tourism', date: '', startTime: '09:00', stops: [] };

export function planToForm(plan: Plan): PlanFormValues {
  return {
    name: plan.name,
    type: plan.type,
    date: plan.date ?? '',
    startTime: plan.startTime ?? '',
    stops: [...plan.stops]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ stopId: s.id, ref: s.ref, durationMin: s.durationMin, startTime: s.startTime ?? '', completedAt: s.completedAt ?? null })),
  };
}

/** Form → repository input (create or update). */
export function formToPlanInput(values: PlanFormValues, isDraft: boolean) {
  const stops: PlanStopInput[] = values.stops.map((s) => ({
    id: s.stopId,
    ref: s.ref,
    durationMin: s.durationMin,
    ...(s.startTime ? { startTime: s.startTime } : {}),
    completedAt: s.completedAt ?? null,
  }));
  return {
    name: values.name.trim(),
    type: values.type,
    date: values.date || undefined,
    startTime: values.startTime || undefined,
    isDraft,
    stops,
  };
}

/** "Save" (not a draft) needs at least one stop. */
export function canFinalize(values: Pick<PlanFormValues, 'stops'>): boolean {
  return values.stops.length > 0;
}

/** Same ref already in the list (a place or booth is added once). */
export function hasRef(stops: Pick<StopField, 'ref'>[], ref: StopField['ref']): boolean {
  return stops.some((s) => JSON.stringify(s.ref) === JSON.stringify(ref));
}
