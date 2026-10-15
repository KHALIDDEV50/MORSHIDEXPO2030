'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ConversationListQuery } from '../model/conversation';
import { conversationRepository as repo } from './repository';

export const conversationKeys = {
  all: ['conversations'] as const,
  list: (q: ConversationListQuery) => ['conversations', 'list', q] as const,
  detail: (id: string) => ['conversations', 'detail', id] as const,
};

export function useConversations(query: ConversationListQuery) {
  return useQuery({ queryKey: conversationKeys.list(query), queryFn: ({ signal }) => repo.list(query, signal), placeholderData: keepPreviousData });
}

export function useConversation(id: string | null) {
  return useQuery({ queryKey: conversationKeys.detail(id ?? ''), queryFn: ({ signal }) => repo.get(id as string, signal), enabled: Boolean(id) });
}
