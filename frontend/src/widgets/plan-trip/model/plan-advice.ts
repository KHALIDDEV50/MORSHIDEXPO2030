import { planStatus, toMinutes, totalDurationMin, type DerivedStop, type Plan } from '@/entities/plan';
import { localize } from '@/shared/api';
import type { TripItem } from './use-plan-trip';

/** One piece of preparation advice; `key` + `values` are rendered through translations. */
export type Advice = { tone: 'info' | 'warning'; key: 'draft' | 'noDate' | 'longDay' | 'hours' | 'midday' | 'expo' | 'overdue'; values?: Record<string, string | number> };

const LONG_DAY_MIN = 8 * 60;
const MIDDAY = [11 * 60, 15 * 60] as const;

/**
 * Preparation advice and warnings derived only from the plan's own data (PRD §4.4): opening hours
 * (always demo — "verify"), long days, outdoor stops at midday, Expo being illustrative, overdue
 * stops today. No invented facts.
 */
export function planAdvice(plan: Plan, items: DerivedStop<TripItem>[], locale: string): Advice[] {
  const advice: Advice[] = [];
  if (plan.isDraft) advice.push({ tone: 'warning', key: 'draft' });
  else if (!plan.date) advice.push({ tone: 'info', key: 'noDate' });

  const overdue = items.filter((s) => s.status === 'overdue').length;
  if (overdue > 0 && planStatus(plan) !== 'completed') advice.push({ tone: 'warning', key: 'overdue', values: { count: overdue } });

  const total = totalDurationMin(plan);
  if (total > LONG_DAY_MIN) advice.push({ tone: 'warning', key: 'longDay', values: { hours: Math.round(total / 60) } });

  if (plan.type === 'expo') advice.push({ tone: 'info', key: 'expo' });

  for (const item of items) {
    if (item.kind !== 'visit' || item.resolved?.kind !== 'place') continue;
    const place = item.resolved.place;
    const start = toMinutes(item.plannedTime);
    if (!place.attributes.indoor && start >= MIDDAY[0] && start < MIDDAY[1]) {
      advice.push({ tone: 'warning', key: 'midday', values: { number: item.number ?? 0, name: item.name, time: item.plannedTime } });
    }
    if (place.openingHours) {
      advice.push({ tone: 'info', key: 'hours', values: { number: item.number ?? 0, name: item.name, hours: localize(place.openingHours.text, locale) } });
    }
  }
  return advice;
}
