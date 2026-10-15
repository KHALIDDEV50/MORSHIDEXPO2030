import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { conversationStore, MessageBlockSchema, type Conversation } from '@/entities/conversation';
import { DEMO_BOOTHS } from '@/entities/expo/api/demo/expo';
import { DEMO_PLACES } from '@/entities/place/api/demo/places';
import { subscriptionStore } from '@/entities/subscription';
import type { Intent } from '../model/intent';
import { buildReply, mockAssistant } from './mock-assistant';
import type { AssistantEvent } from './assistant';

const SCENARIOS: Intent[] = [
  { scenario: 'S1_heritage_sites' },
  { scenario: 'S2_modern_riyadh' },
  { scenario: 'S3_family_day' },
  { scenario: 'S4_food' },
  { scenario: 'S5_beyond_riyadh' },
  { scenario: 'S6_expo_ai_booths' },
  { scenario: 'S7_expo_itinerary' },
  { scenario: 'S8_heritage_itinerary' },
  { scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'history' },
  { scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'focus' },
  { scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'nearby' },
  { scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'overview' },
  { scenario: 'fallback' },
];

const placeIds = new Set(DEMO_PLACES.map((p) => p.id));
const boothIds = new Set(DEMO_BOOTHS.map((b) => b.id));

describe('buildReply', () => {
  for (const intent of SCENARIOS) {
    for (const lang of ['ar', 'en'] as const) {
      it(`${intent.scenario}${'followUp' in intent ? `/${intent.followUp}` : ''} — ${lang}: valid blocks, real references, demo label`, () => {
        const reply = buildReply(intent, 'arif', lang, DEMO_PLACES, DEMO_BOOTHS);
        expect(reply.text.trim().length).toBeGreaterThan(0);
        for (const block of reply.blocks) expect(MessageBlockSchema.safeParse(block).success).toBe(true);
        // Every reply is labelled as demo (PRD §3 honesty rules)
        expect(reply.blocks.some((b) => b.type === 'notice' && b.kind === 'demo')).toBe(true);
        for (const block of reply.blocks) {
          const refs = block.type === 'recommendations' ? block.items.map((i) => i.ref) : block.type === 'itinerary-proposal' ? block.proposal.stops.map((s) => s.ref) : [];
          for (const ref of refs) expect(ref.kind === 'place' ? placeIds.has(ref.placeId) : boothIds.has(ref.boothId)).toBe(true);
        }
      });
    }
  }

  it('returns itinerary proposals of one type only (never mixed)', () => {
    const expo = buildReply({ scenario: 'S7_expo_itinerary' }, 'roaya', 'en', DEMO_PLACES, DEMO_BOOTHS);
    const tourism = buildReply({ scenario: 'S8_heritage_itinerary' }, 'arif', 'en', DEMO_PLACES, DEMO_BOOTHS);
    const proposalOf = (r: typeof expo) => r.blocks.find((b) => b.type === 'itinerary-proposal');
    const p7 = proposalOf(expo);
    const p8 = proposalOf(tourism);
    expect(expo.proposal && tourism.proposal).toBe(true);
    expect(p7?.type === 'itinerary-proposal' && p7.proposal.type).toBe('expo');
    expect(p7?.type === 'itinerary-proposal' && p7.proposal.stops.every((s) => s.ref.kind === 'booth')).toBe(true);
    expect(p8?.type === 'itinerary-proposal' && p8.proposal.stops.every((s) => s.ref.kind === 'place')).toBe(true);
  });

  it('"nearby" uses the verified coordinates (Old Riyadh, not AlUla)', () => {
    const reply = buildReply({ scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'nearby' }, 'arif', 'en', DEMO_PLACES, DEMO_BOOTHS);
    const recs = reply.blocks.find((b) => b.type === 'recommendations');
    const ids = recs?.type === 'recommendations' ? recs.items.map((i) => (i.ref.kind === 'place' ? i.ref.placeId : '')) : [];
    expect(ids[0]).toBe('plc_souq_zal'); // ~250 m away
    expect(ids).toEqual(expect.arrayContaining(['plc_murabba', 'plc_national_museum']));
    expect(ids).not.toContain('plc_hegra');
    expect(ids).not.toContain('plc_masmak');
  });

  it('speaks in the chosen character’s voice', () => {
    const arif = buildReply({ scenario: 'S1_heritage_sites' }, 'arif', 'en', DEMO_PLACES, DEMO_BOOTHS).text;
    const roaya = buildReply({ scenario: 'S1_heritage_sites' }, 'roaya', 'en', DEMO_PLACES, DEMO_BOOTHS).text;
    expect(arif).not.toBe(roaya);
  });
});

describe('mockAssistant.reply (streaming gateway)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    conversationStore.reset();
    subscriptionStore.loadDemoProfile('free');
  });
  afterEach(() => vi.useRealTimers());

  // A conversation without a place context (a place context would turn questions into follow-ups)
  const conversation = (): Conversation => conversationStore.get().conversations.find((c) => c.id === 'conv_family_day')!;

  async function collect(iterable: AsyncIterable<AssistantEvent>): Promise<AssistantEvent[]> {
    const events: AssistantEvent[] = [];
    const run = (async () => {
      for await (const e of iterable) events.push(e);
    })();
    await vi.runAllTimersAsync();
    await run;
    return events;
  }

  it('streams text, then blocks, then saves the reply and debits 1 credit', async () => {
    const before = subscriptionStore.getSnapshot().balance.remaining;
    const events = await collect(mockAssistant.reply({ conversation: conversation(), text: 'What are the most important historical sites?' }));

    const deltas = events.filter((e) => e.type === 'text-delta');
    expect(deltas.length).toBeGreaterThan(3);
    const done = events.at(-1);
    expect(done?.type).toBe('done');
    if (done?.type === 'done') {
      expect(done.message.role).toBe('assistant');
      expect(done.message.blocks.some((b) => b.type === 'recommendations')).toBe(true);
      expect(conversationStore.get().messages.some((m) => m.id === done.message.id)).toBe(true);
    }
    expect(subscriptionStore.getSnapshot().balance.remaining).toBe(before - 1);
  });

  it('answers with an out-of-credits notice (no reply text) when credits are used up', async () => {
    subscriptionStore.loadDemoProfile('free_low'); // 4 credits left
    const snapshot = subscriptionStore.getSnapshot();
    // Exhaust the balance through the same store the app uses
    for (let i = 0; i < snapshot.balance.remaining; i++) {
      await collect(mockAssistant.reply({ conversation: conversation(), text: 'food' }));
    }
    const events = await collect(mockAssistant.reply({ conversation: conversation(), text: 'food' }));
    expect(events.some((e) => e.type === 'text-delta')).toBe(false);
    const done = events.at(-1);
    expect(done?.type === 'done' && done.message.blocks).toEqual([expect.objectContaining({ type: 'notice', kind: 'out_of_credits' })]);
  });

  it('can be aborted mid-stream', async () => {
    const controller = new AbortController();
    const iterable = mockAssistant.reply({ conversation: conversation(), text: 'family day' }, controller.signal);
    const run = (async () => {
      for await (const e of iterable) if (e.type === 'text-delta') controller.abort();
    })();
    await vi.runAllTimersAsync();
    await expect(run).rejects.toMatchObject({ code: 'ABORTED' });
  });
});
