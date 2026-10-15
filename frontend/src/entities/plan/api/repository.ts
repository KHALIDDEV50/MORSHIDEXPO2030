import { usesHttp } from '@/shared/config/env';
import { httpPlanRepository } from './plan.http';
import { mockPlanRepository } from './plan.mock';
import type { PlanRepository } from './plan.repository';

/** Implementation chosen by NEXT_PUBLIC_DATA_SOURCE (+ NEXT_PUBLIC_LIVE_DOMAINS in hybrid mode) (architecture.md §3). */
export const planRepository: PlanRepository = usesHttp('plans') ? httpPlanRepository : mockPlanRepository;
