'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationKeys, conversationRepository, type ItineraryProposal, type ProposalStopData } from '@/entities/conversation';
import { fromMinutes, planKeys, planRepository, toMinutes, type Plan } from '@/entities/plan';
import { localize } from '@/shared/api';

export type SaveChatProposalInput = {
  conversationId: string;
  proposal: ItineraryProposal;
  /** Stops the visitor kept, in their final order (removed stops are left out) */
  keptStops: ProposalStopData[];
  locale: string;
};

/** Planned start time of each kept stop: start + durations + the estimated buffer (D-018/D-020). */
export function scheduleKeptStops(startTime: string, bufferMin: number, stops: ProposalStopData[]): string[] {
  let cursor = toMinutes(startTime);
  return stops.map((stop, i) => {
    if (i > 0) cursor += bufferMin;
    const at = fromMinutes(cursor);
    cursor += stop.durationMin;
    return at;
  });
}

/** The proposal as it should be stored after saving: kept stops in order, removed ones flagged. */
export function savedProposal(proposal: ItineraryProposal, keptStops: ProposalStopData[], planId: string): ItineraryProposal {
  const keyOf = (s: ProposalStopData) => JSON.stringify(s.ref);
  const kept = new Set(keptStops.map(keyOf));
  const removed = proposal.stops.filter((s) => !kept.has(keyOf(s)));
  return {
    ...proposal,
    savedPlanId: planId,
    stops: [...keptStops.map((s) => ({ ...s, kept: true })), ...removed.map((s) => ({ ...s, kept: false }))].map((s, order) => ({ ...s, order })),
  };
}

/**
 * Save an AI itinerary proposal to My Plans (D-021). Idempotent: the plan repository returns the
 * existing plan when this proposal was saved before, so a double click never creates two plans.
 */
export function useSaveChatProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, proposal, keptStops, locale }: SaveChatProposalInput): Promise<Plan> => {
      const times = scheduleKeptStops(proposal.startTime, proposal.bufferMin, keptStops);
      const plan = await planRepository.createFromProposal({
        proposalId: proposal.id,
        name: localize(proposal.title, locale),
        type: proposal.type,
        date: proposal.date,
        startTime: proposal.startTime,
        stops: keptStops.map((s, i) => ({ ref: s.ref, durationMin: s.durationMin, startTime: times[i], objective: s.reason })),
      });
      await conversationRepository.updateProposal(conversationId, savedProposal(proposal, keptStops, plan.id));
      return plan;
    },
    onSuccess: (_plan, { conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
    },
  });
}
