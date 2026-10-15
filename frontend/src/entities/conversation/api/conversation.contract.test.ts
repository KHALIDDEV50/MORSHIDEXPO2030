import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatMessageSchema, ConversationSchema, historyGroup, type ItineraryProposal } from '../model/conversation';
import { mockConversationRepository, conversationStore, queryConversations } from './conversation.mock';
import { seedConversations } from './demo/conversations';

async function run<T>(promise: Promise<T>): Promise<T> {
  const settled = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.runAllTimersAsync();
  const result = await settled;
  if ('error' in result) throw result.error;
  return result.value;
}

describe('demo conversations data', () => {
  const seed = seedConversations();

  it('matches the contracts and every message belongs to a conversation', () => {
    for (const c of seed.conversations) expect(ConversationSchema.safeParse(c).success, c.id).toBe(true);
    for (const m of seed.messages) expect(ChatMessageSchema.safeParse(m).success, m.id).toBe(true);
    const ids = new Set(seed.conversations.map((c) => c.id));
    expect(seed.messages.every((m) => ids.has(m.conversationId))).toBe(true);
    expect(new Set(seed.messages.map((m) => m.id)).size).toBe(seed.messages.length);
  });

  it('has 3 per character across today / last 7 days / older, one saved and one unsaved proposal', () => {
    expect(seed.conversations.filter((c) => c.characterId === 'arif')).toHaveLength(3);
    expect(seed.conversations.filter((c) => c.characterId === 'roaya')).toHaveLength(3);
    expect(new Set(seed.conversations.map((c) => historyGroup(c.updatedAt)))).toEqual(new Set(['today', 'week', 'older']));
    const proposals = seed.messages.flatMap((m) => m.blocks.flatMap((b) => (b.type === 'itinerary-proposal' ? [b.proposal] : [])));
    expect(proposals.filter((p) => p.savedPlanId)).toHaveLength(1);
    expect(proposals.filter((p) => !p.savedPlanId)).toHaveLength(1);
  });

  it('marks every assistant reply that contains generated content as demo', () => {
    const replies = seed.messages.filter((m) => m.role === 'assistant' && m.blocks.some((b) => b.type !== 'text'));
    for (const r of replies) expect(r.blocks.some((b) => b.type === 'notice' && b.kind === 'demo'), r.id).toBe(true);
  });
});

describe('queryConversations', () => {
  const { conversations, messages } = seedConversations();

  it('filters by character and searches titles and message text, newest first', () => {
    expect(queryConversations(conversations, messages, { characterId: 'roaya' }).every((c) => c.characterId === 'roaya')).toBe(true);
    expect(queryConversations(conversations, messages, { q: 'spearhead' }).map((c) => c.id)).toEqual(['conv_masmak_history']);
    const all = queryConversations(conversations, messages, {}).map((c) => c.updatedAt);
    expect(all).toEqual([...all].sort().reverse());
  });
});

describe('mockConversationRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    conversationStore.reset();
  });
  afterEach(() => vi.useRealTimers());

  it('creates, renames and removes a conversation with its messages', async () => {
    const conv = await run(mockConversationRepository.create({ characterId: 'arif', locale: 'en', title: 'New chat' }));
    await run(mockConversationRepository.appendMessage({ conversationId: conv.id, role: 'user', blocks: [{ type: 'text', text: 'Hi' }], status: 'done' }));
    expect((await run(mockConversationRepository.get(conv.id))).messages).toHaveLength(1);

    expect((await run(mockConversationRepository.rename(conv.id, '  Renamed  '))).title).toBe('Renamed');
    await expect(run(mockConversationRepository.rename(conv.id, '   '))).rejects.toMatchObject({ code: 'VALIDATION' });

    await run(mockConversationRepository.remove(conv.id));
    expect(conversationStore.get().messages.some((m) => m.conversationId === conv.id)).toBe(false);
    await expect(run(mockConversationRepository.get(conv.id))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('updates a proposal in place (e.g. marking it saved)', async () => {
    const { messages } = await run(mockConversationRepository.get('conv_expo_ai'));
    const proposal: ItineraryProposal = messages.flatMap((m) => m.blocks.flatMap((b) => (b.type === 'itinerary-proposal' ? [b.proposal] : [])))[0]!;
    await run(mockConversationRepository.updateProposal('conv_expo_ai', { ...proposal, savedPlanId: 'plan_x' }));
    const after = await run(mockConversationRepository.get('conv_expo_ai'));
    const updated = after.messages.flatMap((m) => m.blocks).find((b) => b.type === 'itinerary-proposal');
    expect(updated?.type === 'itinerary-proposal' && updated.proposal.savedPlanId).toBe('plan_x');

    await expect(run(mockConversationRepository.updateProposal('conv_expo_ai', { ...proposal, id: 'prop_missing' }))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('historyGroup', () => {
  const now = new Date(2026, 9, 11, 12, 0);
  it('groups by calendar day', () => {
    expect(historyGroup(new Date(2026, 9, 11, 0, 5).toISOString(), now)).toBe('today');
    expect(historyGroup(new Date(2026, 9, 5, 9, 0).toISOString(), now)).toBe('week');
    expect(historyGroup(new Date(2026, 9, 1, 9, 0).toISOString(), now)).toBe('older');
  });
});
