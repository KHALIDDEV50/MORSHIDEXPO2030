import { z } from 'zod';
import type { SubscriptionSnapshot } from './types';

/** Runtime schema for the persisted demo snapshot (validated on load; invalid → seed). */
const UsageActionSchema = z.enum(['ai_reply', 'voice_reply', 'itinerary_proposal', 'save_plan', 'browse', 'read_aloud']);

export const SubscriptionSnapshotSchema: z.ZodType<SubscriptionSnapshot> = z.object({
  subscription: z
    .object({
      planId: z.enum(['free', 'plus', 'premium']),
      status: z.enum(['active', 'cancel_scheduled', 'expired']),
      interval: z.enum(['monthly', 'annual']),
      startedAt: z.string(),
      renewsAt: z.string().nullable(),
      endsAt: z.string().nullable(),
      simulated: z.literal(true),
    })
    .nullable(),
  balance: z.object({ remaining: z.number().int().nonnegative(), allowance: z.number().int().nonnegative(), periodEndsAt: z.string().nullable() }),
  history: z.array(
    z.object({
      id: z.string(),
      kind: z.union([UsageActionSchema, z.enum(['period_grant', 'plan_change'])]),
      delta: z.number(),
      balanceAfter: z.number(),
      at: z.string(),
    }),
  ),
  savedPlans: z.number().int().nonnegative(),
});
