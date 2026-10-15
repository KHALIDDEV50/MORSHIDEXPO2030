import type { ChatMessage, Conversation, ConversationCharacter, ConversationContext, ConversationListQuery, ItineraryProposal } from '../model/conversation';

/**
 * api-contracts.md §3 ConversationRepository. Producing assistant replies (AssistantGateway,
 * SSE streaming in production) is Phase 7; `appendMessage` is how the demo gateway records them.
 */
export interface ConversationRepository {
  list(query: ConversationListQuery, signal?: AbortSignal): Promise<Conversation[]>;
  get(id: string, signal?: AbortSignal): Promise<{ conversation: Conversation; messages: ChatMessage[] }>;
  create(input: { characterId: ConversationCharacter; locale: string; title: string; context?: ConversationContext }): Promise<Conversation>;
  rename(id: string, title: string): Promise<Conversation>;
  remove(id: string): Promise<void>;
  updateProposal(conversationId: string, proposal: ItineraryProposal): Promise<void>;
  appendMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
}
