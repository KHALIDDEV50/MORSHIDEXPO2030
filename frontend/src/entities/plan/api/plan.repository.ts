import type { Page } from '@/shared/api';
import type { FeaturedPlan, Plan, PlanListQuery, PlanStop, ProposalToSave } from '../model/plan';

export type PlanCreateInput = Pick<Plan, 'name' | 'type' | 'date' | 'startTime' | 'isDraft'> & {
  stops: Omit<PlanStop, 'id' | 'order'>[];
};
/** A stop as edited in the plan editor: existing stops keep their id (and completion). */
export type PlanStopInput = Omit<PlanStop, 'id' | 'order'> & { id?: string };

export type PlanPatch = Partial<Pick<Plan, 'name' | 'type' | 'date' | 'startTime' | 'isDraft' | 'start' | 'end'>> & {
  /** Replaces the whole ordered stop list (the editor's Save) */
  stops?: PlanStopInput[];
};

/**
 * api-contracts.md §3 PlanRepository. Two refinements over the v1 proposal:
 * `createFromProposal` takes the kept proposal content (still idempotent per proposalId, D-021),
 * and `copyFeatured` takes the locale so the copy gets a readable name.
 */
export interface PlanRepository {
  list(query: PlanListQuery, signal?: AbortSignal): Promise<Page<Plan>>;
  listFeatured(signal?: AbortSignal): Promise<FeaturedPlan[]>;
  get(id: string, signal?: AbortSignal): Promise<Plan>;
  create(input: PlanCreateInput): Promise<Plan>;
  createFromProposal(proposal: ProposalToSave): Promise<Plan>;
  update(id: string, patch: PlanPatch): Promise<Plan>;
  remove(id: string): Promise<void>;
  addStop(id: string, stop: Omit<PlanStop, 'id' | 'order'>): Promise<Plan>;
  removeStop(id: string, stopId: string): Promise<Plan>;
  reorderStops(id: string, orderedStopIds: string[]): Promise<Plan>;
  setStopCompleted(id: string, stopId: string, completed: boolean): Promise<Plan>;
  start(id: string): Promise<Plan>;
  copyFeatured(featuredId: string, locale: string): Promise<Plan>;
}
