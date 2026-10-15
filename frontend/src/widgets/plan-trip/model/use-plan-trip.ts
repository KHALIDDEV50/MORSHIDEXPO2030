'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  activeBreaks,
  breakStartTime,
  computeProgress,
  deriveStops,
  END_STOP_ID,
  scheduleStops,
  sortedStops,
  toMinutes,
  fromMinutes,
  type DerivedStop,
  type Plan,
  type TripStopContent,
} from '@/entities/plan';
import { useStopRefs, type ResolvedStop } from '@/features/send-chat-message';
import { localize, type LatLng } from '@/shared/api';

export type TripItem = TripStopContent & {
  /** Repository id for completion: the stop id, END_STOP_ID for the end point, null for the start */
  repoStopId: string | null;
  mapPosition: LatLng | [number, number] | null;
  resolved: ResolvedStop | null;
};

/** Today's date and time (local) as "YYYY-MM-DD" / "HH:mm". */
function nowParts(): { date: string; time: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/**
 * A saved plan as the trip timeline / map / guided mode see it: start → numbered stops → end,
 * planned times (estimates), manual completion (D-019) and derived statuses. One derivation for
 * List, Map and Guided, so they can never disagree.
 */
export function usePlanTrip(plan: Plan | undefined, currentId: string | null) {
  const locale = useLocale();
  const t = useTranslations('planDetails');
  const { resolve, ready, layout } = useStopRefs();

  return useMemo(() => {
    if (!plan) return null;
    const times = scheduleStops(plan);
    const ordered = sortedStops(plan);
    const breakAfter = new Map(activeBreaks(plan).map((b) => [b.afterStopId, b]));
    const items: TripItem[] = [];

    const endpoint = (e: NonNullable<Plan['start']>) => {
      if (e.kind === 'point') return { name: localize(e.name, locale), position: e.location as LatLng | [number, number], resolved: null };
      const r = resolve(e.kind === 'place' ? { kind: 'place', placeId: e.placeId } : { kind: 'booth', boothId: e.boothId });
      return { name: r?.name ?? t('unknownStop'), position: r?.position ?? null, resolved: r };
    };

    if (plan.start) {
      const s = endpoint(plan.start);
      items.push({
        id: `${plan.id}:start`,
        kind: 'start',
        plannedTime: plan.startTime ?? times[0] ?? '09:00',
        durationMin: 0,
        completed: Boolean(plan.startedAt),
        position: { x: 0, y: 0 },
        name: s.name,
        area: s.resolved?.area ?? '',
        description: s.resolved?.summary ?? t('startDescription'),
        tips: [],
        repoStopId: null,
        mapPosition: s.position,
        resolved: s.resolved,
      });
    }

    ordered.forEach((stop, i) => {
      const r = resolve(stop.ref);
      items.push({
        id: stop.id,
        kind: 'visit',
        plannedTime: times[i] ?? '09:00',
        durationMin: stop.durationMin,
        completed: Boolean(stop.completedAt),
        position: { x: 0, y: 0 },
        name: r ? (r.kind === 'booth' ? `${r.number} · ${r.name}` : r.name) : t('unknownStop'),
        area: r?.area ?? '',
        description: r?.summary ?? '',
        tips: r?.kind === 'place' ? r.place.tips.map((tip) => localize(tip, locale)) : [],
        repoStopId: stop.id,
        mapPosition: r?.position ?? null,
        resolved: r,
      });
      // A break (e.g. lunch) right after its stop: not a place, so no map marker and no number (P-028)
      const brk = breakAfter.get(stop.id);
      if (brk) {
        items.push({
          id: brk.id,
          kind: 'break',
          plannedTime: breakStartTime(brk, times[i] ?? '09:00', stop.durationMin),
          durationMin: brk.durationMin,
          completed: Boolean(brk.completedAt),
          position: { x: 0, y: 0 },
          name: localize(brk.label, locale),
          area: '',
          description: '',
          tips: [],
          repoStopId: brk.id,
          mapPosition: null,
          resolved: null,
        });
      }
    });

    if (plan.end) {
      const e = endpoint(plan.end);
      // The end follows the last timed item (a stop, or a break after the last stop)
      const lastItem = items.at(-1);
      items.push({
        id: `${plan.id}:end`,
        kind: 'destination',
        plannedTime: lastItem && lastItem.kind !== 'start' ? fromMinutes(toMinutes(lastItem.plannedTime) + lastItem.durationMin + 15) : (plan.startTime ?? '09:00'),
        durationMin: 0,
        completed: Boolean(plan.endCompletedAt),
        position: { x: 0, y: 0 },
        name: e.name,
        area: e.resolved?.area ?? '',
        description: e.resolved?.summary ?? '',
        tips: [],
        repoStopId: END_STOP_ID,
        mapPosition: e.position,
        resolved: e.resolved,
      });
    }

    // Overdue states only on the plan's own day (D-019)
    const now = nowParts();
    const isToday = plan.date === now.date;
    const derived: DerivedStop<TripItem>[] = deriveStops(items, { currentId, now: isToday ? now.time : null });
    const progress = computeProgress(derived);
    const current = derived.find((s) => s.status === 'current') ?? derived.find((s) => s.kind !== 'start' && !s.completed) ?? null;
    let progressIndex = 0;
    derived.forEach((s, i) => {
      if (s.completed || s.status === 'current') progressIndex = i;
    });
    return { items: derived, progress, current, progressIndex, isToday, ready, layout };
  }, [plan, currentId, resolve, ready, layout, locale, t]);
}
