import { z } from 'zod';
import { pageSchema, request } from '@/shared/api';
import { FeaturedPlanSchema, PlanSchema } from '../model/plan';
import type { PlanRepository } from './plan.repository';

/** HTTP implementation against the PROPOSED endpoints (api-contracts.md §4). Not connected yet. */
export const httpPlanRepository: PlanRepository = {
  list: (q, signal) => request('/plans', { signal, schema: pageSchema(PlanSchema), query: { tab: q.tab, q: q.q, page: q.page, pageSize: q.pageSize } }),
  listFeatured: (signal) => request('/plans/featured', { signal, schema: z.array(FeaturedPlanSchema) }),
  get: (id, signal) => request(`/plans/${encodeURIComponent(id)}`, { signal, schema: PlanSchema }),
  create: (input) => request('/plans', { method: 'POST', body: input, schema: PlanSchema }),
  createFromProposal: (p) =>
    request(`/plans/from-proposal/${encodeURIComponent(p.proposalId)}`, { method: 'POST', body: { name: p.name, date: p.date, stops: p.stops }, schema: PlanSchema }),
  update: (id, patch) => request(`/plans/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, schema: PlanSchema }),
  remove: (id) => request(`/plans/${encodeURIComponent(id)}`, { method: 'DELETE', schema: z.null() }).then(() => undefined),
  addStop: (id, stop) => request(`/plans/${encodeURIComponent(id)}/stops`, { method: 'POST', body: stop, schema: PlanSchema }),
  removeStop: (id, stopId) => request(`/plans/${encodeURIComponent(id)}/stops/${encodeURIComponent(stopId)}`, { method: 'DELETE', schema: PlanSchema }),
  reorderStops: (id, orderedStopIds) => request(`/plans/${encodeURIComponent(id)}/stops/order`, { method: 'PUT', body: { orderedStopIds }, schema: PlanSchema }),
  setStopCompleted: (id, stopId, completed) =>
    request(`/plans/${encodeURIComponent(id)}/stops/${encodeURIComponent(stopId)}/completion`, { method: 'PUT', body: { completed }, schema: PlanSchema }),
  start: (id) => request(`/plans/${encodeURIComponent(id)}/start`, { method: 'POST', schema: PlanSchema }),
  copyFeatured: (featuredId, locale) => request(`/plans/featured/${encodeURIComponent(featuredId)}/copy`, { method: 'POST', body: { locale }, schema: PlanSchema }),
};
