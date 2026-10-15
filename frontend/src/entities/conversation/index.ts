export { MessageBubble } from './ui/message-bubble';
export { TypingIndicator } from './ui/typing-indicator';
export { SuggestionCards, type SuggestionCardItem } from './ui/suggestion-cards';
export {
  ConversationSchema,
  ChatMessageSchema,
  MessageBlockSchema,
  ItineraryProposalSchema,
  ProposalStopSchema,
  ConversationContextSchema,
  StopRefSchema,
  historyGroup,
  type Conversation,
  type ConversationCharacter,
  type ConversationContext,
  type ConversationListQuery,
  type ChatMessage,
  type MessageBlock,
  type ItineraryProposal,
  type ProposalStopData,
  type StopRef,
  type HistoryGroup,
} from './model/conversation';
export { conversationRepository } from './api/repository';
export { conversationStore, queryConversations } from './api/conversation.mock';
export { conversationKeys, useConversations, useConversation } from './api/queries';
export type { ConversationRepository } from './api/conversation.repository';
