import type { ExpoBooth } from '@/entities/expo';
import type { Place } from '@/entities/place';
import { sortedStops, type Plan, type PlanStopInput, type PlanStopRef } from '@/entities/plan';

/**
 * "Replace this stop" (DEMO): alternatives are ranked from the guide data only — shared category,
 * same area/zone, real coordinates or site-plan positions. Not an AI request; the UI says so.
 */
export type ReplaceReason = 'sameCategory' | 'similar' | 'nearby' | 'sameRegion' | 'sameZone';

export type StopAlternative = {
  id: string;
  ref: PlanStopRef;
  durationMin: number;
  reasons: ReplaceReason[];
};

const MAX_ALTERNATIVES = 4;

/** Great-circle distance in km (ranking only — never shown as distance from the visitor). */
function km(a: Place['location'], b: Place['location']): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Ids already used by the plan (stops and start / end points) — never offered again. */
export function planRefIds(plan: Plan): Set<string> {
  const ids = new Set(plan.stops.map((s) => (s.ref.kind === 'place' ? s.ref.placeId : s.ref.boothId)));
  for (const e of [plan.start, plan.end]) {
    if (e?.kind === 'place') ids.add(e.placeId);
    if (e?.kind === 'booth') ids.add(e.boothId);
  }
  return ids;
}

type Scored = StopAlternative & { score: number; distance: number };

const rank = (list: Scored[]) =>
  list
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score || a.distance - b.distance)
    .slice(0, MAX_ALTERNATIVES)
    .map(({ id, ref, durationMin, reasons }) => ({ id, ref, durationMin, reasons }));

/** Tourism: same main category first, then related categories, then what is close by. */
export function placeAlternatives(current: Place, places: Place[], exclude: Set<string>): StopAlternative[] {
  return rank(
    places
      .filter((p) => p.id !== current.id && !exclude.has(p.id))
      .map((p) => {
        const reasons: ReplaceReason[] = [];
        let score = 0;
        const distance = km(current.location, p.location);
        if (p.categories[0] === current.categories[0]) {
          score += 3;
          reasons.push('sameCategory');
        } else if (p.categories.some((c) => current.categories.includes(c))) {
          score += 1;
          reasons.push('similar');
        }
        if (distance <= 5) {
          score += 2;
          reasons.push('nearby');
        } else if (p.region.regionCode === current.region.regionCode) {
          score += 1;
          reasons.push('sameRegion');
        }
        return { id: p.id, ref: { kind: 'place' as const, placeId: p.id }, durationMin: p.suggestedDurationMin, reasons, score, distance };
      }),
  );
}

/** Expo: same pavilion category first, then the same zone, then the nearest site-plan positions. */
export function boothAlternatives(current: ExpoBooth, booths: ExpoBooth[], exclude: Set<string>): StopAlternative[] {
  return rank(
    booths
      .filter((b) => b.id !== current.id && !exclude.has(b.id))
      .map((b) => {
        const reasons: ReplaceReason[] = [];
        let score = 0;
        const distance = Math.hypot(b.position[0] - current.position[0], b.position[1] - current.position[1]);
        if (b.category === current.category) {
          score += 3;
          reasons.push('sameCategory');
        }
        if (b.zoneId === current.zoneId) {
          score += 2;
          reasons.push('sameZone');
        } else if (distance <= 160) {
          score += 1;
          reasons.push('nearby');
        }
        return { id: b.id, ref: { kind: 'booth' as const, boothId: b.id }, durationMin: b.suggestedDurationMin, reasons, score, distance };
      }),
  );
}

/**
 * The plan's stops with one stop swapped for the alternative, in the same position. Every other
 * stop keeps its id, order, times and completion; the new stop starts as not completed.
 */
export function replaceStopInputs(plan: Plan, stopId: string, alternative: Pick<StopAlternative, 'ref' | 'durationMin'>): PlanStopInput[] {
  return sortedStops(plan).map((s) =>
    s.id === stopId
      ? { ref: alternative.ref, durationMin: alternative.durationMin, startTime: s.startTime, completedAt: null }
      : { id: s.id, ref: s.ref, durationMin: s.durationMin, startTime: s.startTime, objective: s.objective, completedAt: s.completedAt ?? null },
  );
}
