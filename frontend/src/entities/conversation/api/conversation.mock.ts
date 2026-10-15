import { z } from 'zod';
import { ApiError, createDemoStore, demoCall, demoId, nowIso } from '@/shared/api';
import { ChatMessageSchema, ConversationSchema, type ChatMessage, type Conversation, type ConversationListQuery } from '../model/conversation';
import { seedConversations } from './demo/conversations';
import type { ConversationRepository } from './conversation.repository';

/** Persistent DEMO store (localStorage `morshid:v1:conversations`). */
export const conversationStore = createDemoStore(
  'conversations',
  z.object({ conversations: z.array(ConversationSchema), messages: z.array(ChatMessageSchema) }),
  seedConversations,
);

/** Pure list query: character filter + search in titles and message text, newest first. */
export function queryConversations(conversations: Conversation[], messages: ChatMessage[], query: ConversationListQuery): Conversation[] {
  const q = query.q?.trim().toLowerCase() ?? '';
  const textOf = (id: string) =>
    messages
      .filter((m) => m.conversationId === id)
      .flatMap((m) => m.blocks.map((b) => (b.type === 'text' ? b.text : '')))
      .join(' ')
      .toLowerCase();
  return conversations
    .filter((c) => (!query.characterId || c.characterId === query.characterId) && (!q || c.title.toLowerCase().includes(q) || textOf(c.id).includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function findConversation(id: string): Conversation {
  const conversation = conversationStore.get().conversations.find((c) => c.id === id);
  if (!conversation) throw new ApiError('NOT_FOUND', `Conversation ${id} not found`);
  return conversation;
}

function touch(id: string, patch: Partial<Conversation> = {}): Conversation {
  const next = { ...findConversation(id), ...patch, updatedAt: nowIso() };
  conversationStore.update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? next : c)) }));
  return next;
}

export const mockConversationRepository: ConversationRepository = {
  list: (query, signal) => demoCall('conversations', () => queryConversations(conversationStore.get().conversations, conversationStore.get().messages, query), signal),

  get: (id, signal) =>
    demoCall(
      'conversations',
      () => ({
        conversation: findConversation(id),
        messages: conversationStore
          .get()
          .messages.filter((m) => m.conversationId === id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }),
      signal,
    ),

  create: (input) =>
    demoCall('conversations', () => {
      const conversation: Conversation = { ...input, id: demoId('conv'), createdAt: nowIso(), updatedAt: nowIso() };
      conversationStore.update((s) => ({ ...s, conversations: [conversation, ...s.conversations] }));
      return conversation;
    }),

  rename: (id, title) =>
    demoCall('conversations', () => {
      const trimmed = title.trim();
      if (!trimmed) throw new ApiError('VALIDATION', 'Title is required');
      return touch(id, { title: trimmed.slice(0, 120) });
    }),

  remove: (id) =>
    demoCall('conversations', () => {
      findConversation(id);
      conversationStore.update((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        messages: s.messages.filter((m) => m.conversationId !== id),
      }));
    }),

  updateProposal: (conversationId, proposal) =>
    demoCall('conversations', () => {
      findConversation(conversationId);
      let found = false;
      conversationStore.update((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.conversationId !== conversationId
            ? m
            : {
                ...m,
                blocks: m.blocks.map((b) => {
                  if (b.type !== 'itinerary-proposal' || b.proposal.id !== proposal.id) return b;
                  found = true;
                  return { ...b, proposal };
                }),
              },
        ),
      }));
      if (!found) throw new ApiError('NOT_FOUND', `Proposal ${proposal.id} not found`);
      touch(conversationId);
    }),

  appendMessage: (input) =>
    demoCall('conversations', () => {
      findConversation(input.conversationId);
      const message: ChatMessage = { ...input, id: demoId('msg'), createdAt: nowIso() };
      conversationStore.update((s) => ({ ...s, messages: [...s.messages, message] }));
      touch(input.conversationId);
      return message;
    }),
};
