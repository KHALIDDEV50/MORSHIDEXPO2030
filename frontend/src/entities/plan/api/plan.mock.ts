import { z } from 'zod';
import { ApiError, createDemoStore, demoCall, demoId, localize, nowIso, paginate } from '@/shared/api';
import { END_STOP_ID, matchesTab, PlanSchema, renumberStops, sortedStops, stopsMatchType, type Plan, type PlanListQuery } from '../model/plan';
import { DEMO_FEATURED_PLANS, seedPlans } from './demo/plans';
import type { PlanRepository } from './plan.repository';

/** Persistent DEMO store (localStorage `morshid:v1:plans-v3`, validated on load — demo-data.md §4). */
// v2 (2026-10-12): plans gained start/end points — older saved demo plans are replaced by the seed
// v3 (2026-10-13): plans gained breaks, and the in-progress demo plans run "today" (P-028)
export const planStore = createDemoStore('plans-v3', z.array(PlanSchema), seedPlans, { replaces: ['plans', 'plans-v2'] });

const DEMO_OWNER = 'usr_demo';

/** Pure list query: tab + name search, newest first. */
export function queryPlans(plans: Plan[], query: PlanListQuery): Plan[] {
  const q = query.q?.trim().toLowerCase() ?? '';
  return plans
    .filter((p) => matchesTab(p, query.tab ?? 'all') && (!q || p.name.toLowerCase().includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function find(id: string): Plan {
  const plan = planStore.get().find((p) => p.id === id);
  if (!plan) throw new ApiError('NOT_FOUND', `Plan ${id} not found`);
  return plan;
}

/** Applies a change to one plan, bumps updatedAt, persists, and returns the new plan. */
function mutate(id: string, change: (plan: Plan) => Plan): Plan {
  const next = { ...change(find(id)), updatedAt: nowIso() };
  planStore.update((plans) => plans.map((p) => (p.id === id ? next : p)));
  return next;
}

function insert(plan: Plan): Plan {
  planStore.update((plans) => [plan, ...plans]);
  return plan;
}

const newStopId = () => demoId('stop');

export const mockPlanRepository: PlanRepository = {
  list: (query, signal) => demoCall('plans', () => paginate(queryPlans(planStore.get(), query), query.page, query.pageSize ?? 12), signal),
  listFeatured: (signal) => demoCall('plans', () => DEMO_FEATURED_PLANS, signal),
  get: (id, signal) => demoCall('plans', () => find(id), signal),

  create: (input) =>
    demoCall('plans', () => {
      if (!stopsMatchType(input.type, input.stops.map((s) => s.ref))) throw new ApiError('VALIDATION', 'Stops must match the plan type');
      return insert({
        ...input,
        id: demoId('plan'),
        ownerId: DEMO_OWNER,
        stops: input.stops.map((s, order) => ({ ...s, id: newStopId(), order })),
        startedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }),

  createFromProposal: (proposal) =>
    demoCall('plans', () => {
      // Idempotent (D-021): saving the same proposal again returns the existing plan
      const existing = planStore.get().find((p) => p.sourceProposalId === proposal.proposalId);
      if (existing) return existing;
      return insert({
        id: demoId('plan'),
        ownerId: DEMO_OWNER,
        name: proposal.name,
        type: proposal.type,
        date: proposal.date,
        startTime: proposal.startTime,
        isDraft: false,
        stops: proposal.stops.map((s, order) => ({ ...s, id: newStopId(), order, completedAt: null })),
        startedAt: null,
        sourceProposalId: proposal.proposalId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }),

  update: (id, { stops, ...patch }) =>
    demoCall('plans', () =>
      mutate(id, (p) => {
        const type = patch.type ?? p.type;
        const nextStops = stops
          ? stops.map((s, order) => {
              const existing = s.id ? p.stops.find((x) => x.id === s.id) : undefined;
              return { ...s, id: existing?.id ?? newStopId(), order, completedAt: existing ? (s.completedAt ?? existing.completedAt ?? null) : null };
            })
          : p.stops;
        if (!stopsMatchType(type, nextStops.map((s) => s.ref))) throw new ApiError('VALIDATION', 'Stops must match the plan type (tourism places or Expo booths)');
        return { ...p, ...patch, type, stops: nextStops };
      }),
    ),

  remove: (id) =>
    demoCall('plans', () => {
      find(id);
      planStore.update((plans) => plans.filter((p) => p.id !== id));
    }),

  addStop: (id, stop) =>
    demoCall('plans', () => mutate(id, (p) => ({ ...p, stops: [...sortedStops(p), { ...stop, id: newStopId(), order: p.stops.length, completedAt: null }] }))),

  removeStop: (id, stopId) =>
    demoCall('plans', () =>
      mutate(id, (p) => {
        if (!p.stops.some((s) => s.id === stopId)) throw new ApiError('NOT_FOUND', `Stop ${stopId} not found`);
        return { ...p, stops: renumberStops(sortedStops(p).filter((s) => s.id !== stopId)) };
      }),
    ),

  reorderStops: (id, orderedStopIds) =>
    demoCall('plans', () =>
      mutate(id, (p) => {
        const byId = new Map(p.stops.map((s) => [s.id, s]));
        const valid = orderedStopIds.length === p.stops.length && orderedStopIds.every((sid) => byId.has(sid)) && new Set(orderedStopIds).size === orderedStopIds.length;
        if (!valid) throw new ApiError('VALIDATION', 'orderedStopIds must list every stop exactly once');
        return { ...p, stops: renumberStops(orderedStopIds.map((sid) => byId.get(sid)!)) };
      }),
    ),

  setStopCompleted: (id, stopId, completed) =>
    demoCall('plans', () =>
      mutate(id, (p) => {
        // Manual completion only (D-019). The end point is completed like a stop.
        if (stopId === END_STOP_ID) {
          if (!p.end) throw new ApiError('NOT_FOUND', 'This plan has no end point');
          return { ...p, startedAt: p.startedAt ?? (completed ? nowIso() : null), endCompletedAt: completed ? nowIso() : null };
        }
        // Breaks (P-028) are completed like stops
        if (p.breaks?.some((b) => b.id === stopId)) {
          return {
            ...p,
            startedAt: p.startedAt ?? (completed ? nowIso() : null),
            breaks: p.breaks.map((b) => (b.id === stopId ? { ...b, completedAt: completed ? nowIso() : null } : b)),
          };
        }
        if (!p.stops.some((s) => s.id === stopId)) throw new ApiError('NOT_FOUND', `Stop ${stopId} not found`);
        return {
          ...p,
          startedAt: p.startedAt ?? (completed ? nowIso() : null),
          stops: p.stops.map((s) => (s.id === stopId ? { ...s, completedAt: completed ? nowIso() : null } : s)),
        };
      }),
    ),

  start: (id) =>
    demoCall('plans', () =>
      mutate(id, (p) => {
        if (p.isDraft) throw new ApiError('CONFLICT', 'Drafts cannot be started');
        return { ...p, startedAt: p.startedAt ?? nowIso() };
      }),
    ),

  copyFeatured: (featuredId, locale) =>
    demoCall('plans', () => {
      const featured = DEMO_FEATURED_PLANS.find((f) => f.id === featuredId);
      if (!featured) throw new ApiError('NOT_FOUND', `Featured plan ${featuredId} not found`);
      return insert({
        id: demoId('plan'),
        ownerId: DEMO_OWNER,
        name: localize(featured.name, locale),
        type: featured.type,
        startTime: featured.startTime,
        isDraft: true, // the user picks a date before it becomes upcoming
        stops: featured.stops.map((s) => ({ ...s, id: newStopId(), completedAt: null })),
        startedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }),
};
