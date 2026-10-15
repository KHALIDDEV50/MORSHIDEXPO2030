'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  conversationKeys,
  conversationRepository,
  useConversation,
  type ChatMessage,
  type Conversation,
  type ConversationCharacter,
  type ConversationContext,
  type MessageBlock,
} from '@/entities/conversation';
import { isApiError } from '@/shared/api';
import { assistantGateway } from '../api/mock-assistant';

/** The reply being produced right now (shown live until it's saved and refetched). */
export type PendingReply = {
  conversationId: string;
  phase: 'thinking' | 'streaming';
  text: string;
  blocks: MessageBlock[];
};

type Options = {
  /** null = a new conversation that is created on the first message */
  conversationId: string | null;
  characterId: ConversationCharacter;
  locale: string;
  context?: ConversationContext;
  /** Called after the first message created the conversation (e.g. put its id in the URL) */
  onConversationCreated?: (conversation: Conversation) => void;
};

const TITLE_LENGTH = 60;

/**
 * Chat controller (PRD §4.1): persists the user's message, streams the assistant reply from the
 * gateway, then saves it. Errors keep the user's message and offer Retry (the reply is retried,
 * the message is not duplicated). Switching conversation aborts a running reply.
 */
export function useChatSession({ conversationId, characterId, locale, context, onConversationCreated }: Options) {
  const queryClient = useQueryClient();
  const detail = useConversation(conversationId);
  const [pending, setPending] = useState<PendingReply | null>(null);
  const [failed, setFailed] = useState<{ conversationId: string; text: string } | null>(null);
  const running = useRef<{ conversationId: string; controller: AbortController } | null>(null);
  /** True from the moment a message is sent until its reply finished (blocks double sends) */
  const sending = useRef(false);

  // Leaving the conversation (or the page) stops its reply — but not when the URL just switched
  // to the conversation this send created.
  useEffect(() => {
    if (running.current && running.current.conversationId !== conversationId) {
      running.current.controller.abort();
      running.current = null;
    }
  }, [conversationId]);
  useEffect(() => () => running.current?.controller.abort(), []);

  const refresh = useCallback(
    (id: string) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: [...conversationKeys.all, 'list'] }),
      ]),
    [queryClient],
  );

  const streamReply = useCallback(
    async (conversation: Conversation, text: string) => {
      const controller = new AbortController();
      running.current = { conversationId: conversation.id, controller };
      setFailed(null);
      setPending({ conversationId: conversation.id, phase: 'thinking', text: '', blocks: [] });
      try {
        for await (const event of assistantGateway.reply({ conversation, text }, controller.signal)) {
          if (event.type === 'text-delta') {
            setPending((p) => p && { ...p, phase: 'streaming', text: p.text + event.delta });
          } else if (event.type === 'block-start' && event.block.type !== 'text') {
            setPending((p) => p && { ...p, phase: 'streaming', blocks: [...p.blocks, event.block] });
          } else if (event.type === 'done') {
            await refresh(conversation.id);
          }
        }
      } catch (error) {
        if (isApiError(error) && error.code === 'ABORTED') return;
        setFailed({ conversationId: conversation.id, text });
      } finally {
        if (running.current?.controller === controller) running.current = null;
        setPending((p) => (p?.conversationId === conversation.id ? null : p));
      }
    },
    [refresh],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending.current) return;
      sending.current = true;
      let conversation = detail.data?.conversation;
      // Optimistic "thinking" state while the message is being saved
      setPending({ conversationId: conversation?.id ?? 'new', phase: 'thinking', text: '', blocks: [] });
      try {
        if (!conversation) {
          conversation = await conversationRepository.create({
            characterId,
            locale,
            title: message.length > TITLE_LENGTH ? `${message.slice(0, TITLE_LENGTH - 1)}…` : message,
            context,
          });
          onConversationCreated?.(conversation);
        }
        await conversationRepository.appendMessage({ conversationId: conversation.id, role: 'user', blocks: [{ type: 'text', text: message }], status: 'done' });
        await refresh(conversation.id);
      } catch {
        setPending(null);
        setFailed(conversation ? { conversationId: conversation.id, text: message } : null);
        sending.current = false;
        return;
      }
      try {
        await streamReply(conversation, message);
      } finally {
        sending.current = false;
      }
    },
    [characterId, context, detail.data, locale, onConversationCreated, refresh, streamReply],
  );

  const retry = useCallback(() => {
    const conversation = detail.data?.conversation;
    if (!failed || !conversation || failed.conversationId !== conversation.id || sending.current) return;
    sending.current = true;
    void streamReply(conversation, failed.text).finally(() => {
      sending.current = false;
    });
  }, [detail.data, failed, streamReply]);

  const stop = useCallback(() => running.current?.controller.abort(), []);

  const activeId = detail.data?.conversation.id ?? null;
  const messages: ChatMessage[] = detail.data?.messages ?? [];
  return {
    conversation: detail.data?.conversation ?? null,
    messages,
    loading: Boolean(conversationId) && detail.isPending,
    loadError: detail.isError,
    reload: () => void detail.refetch(),
    /** Live reply for this conversation (or for a conversation being created) */
    pending: pending && (pending.conversationId === activeId || pending.conversationId === 'new' || pending.conversationId === conversationId) ? pending : null,
    /** The last send failed: show the error + Retry on that message */
    failed: failed && failed.conversationId === activeId ? failed : null,
    busy: pending !== null,
    send,
    retry,
    stop,
  };
}
