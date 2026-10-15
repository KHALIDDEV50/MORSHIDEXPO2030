import { z } from 'zod';
import { notImplemented, request } from '@/shared/api';
import { ChatMessageSchema, ConversationSchema } from '../model/conversation';
import type { ConversationRepository } from './conversation.repository';

/**
 * HTTP implementation against the PROPOSED endpoints (api-contracts.md §4). Not connected yet.
 * Messages are created server-side by `POST /conversations/:id/messages` (SSE), so
 * `appendMessage` has no endpoint.
 */
export const httpConversationRepository: ConversationRepository = {
  list: (q, signal) => request('/conversations', { signal, schema: z.array(ConversationSchema), query: { character: q.characterId, q: q.q } }),
  get: (id, signal) =>
    request(`/conversations/${encodeURIComponent(id)}`, { signal, schema: z.object({ conversation: ConversationSchema, messages: z.array(ChatMessageSchema) }) }),
  create: (input) => request('/conversations', { method: 'POST', body: input, schema: ConversationSchema }),
  rename: (id, title) => request(`/conversations/${encodeURIComponent(id)}`, { method: 'PATCH', body: { title }, schema: ConversationSchema }),
  remove: (id) => request(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE', schema: z.null() }).then(() => undefined),
  updateProposal: (conversationId, proposal) =>
    request(`/conversations/${encodeURIComponent(conversationId)}/proposals/${encodeURIComponent(proposal.id)}`, { method: 'PUT', body: proposal, schema: z.null() }).then(() => undefined),
  appendMessage: async () => notImplemented('ConversationRepository.appendMessage'),
};
