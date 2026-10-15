import { usesHttp } from '@/shared/config/env';
import { httpConversationRepository } from './conversation.http';
import { mockConversationRepository } from './conversation.mock';
import type { ConversationRepository } from './conversation.repository';

/** Implementation chosen by NEXT_PUBLIC_DATA_SOURCE (+ NEXT_PUBLIC_LIVE_DOMAINS in hybrid mode) (architecture.md §3). */
export const conversationRepository: ConversationRepository = usesHttp('conversations') ? httpConversationRepository : mockConversationRepository;
