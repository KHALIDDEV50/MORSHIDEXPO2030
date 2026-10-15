import { describe, expect, it } from 'vitest';
import type { ItineraryProposal } from '@/entities/conversation';
import { savedProposal, scheduleKeptStops } from './use-save-chat-proposal';

const stop = (placeId: string, order: number, durationMin: number) => ({
  ref: { kind: 'place' as const, placeId },
  order,
  durationMin,
  priority: 'high' as const,
  reason: { ar: '', en: '' },
  kept: true,
});

const proposal: ItineraryProposal = {
  id: 'prop_test',
  title: { ar: 'خطة', en: 'Plan' },
  type: 'tourism',
  startTime: '08:30',
  bufferMin: 15,
  rationale: { ar: '', en: '' },
  stops: [stop('plc_masmak', 0, 60), stop('plc_souq_zal', 1, 45), stop('plc_murabba', 2, 45)],
};

describe('saving a chat proposal', () => {
  it('schedules kept stops from the start time with the estimated buffer', () => {
    expect(scheduleKeptStops('08:30', 15, proposal.stops)).toEqual(['08:30', '09:45', '10:45']);
    // Removing the middle stop moves the next one earlier
    expect(scheduleKeptStops('08:30', 15, [proposal.stops[0]!, proposal.stops[2]!])).toEqual(['08:30', '09:45']);
  });

  it('stores the kept order and flags removed stops, with the saved plan id', () => {
    const kept = [proposal.stops[2]!, proposal.stops[0]!]; // reordered, Souq Al-Zal removed
    const result = savedProposal(proposal, kept, 'plan_x');
    expect(result.savedPlanId).toBe('plan_x');
    expect(result.stops.map((s) => [s.ref.kind === 'place' && s.ref.placeId, s.kept, s.order])).toEqual([
      ['plc_murabba', true, 0],
      ['plc_masmak', true, 1],
      ['plc_souq_zal', false, 2],
    ]);
  });
});
