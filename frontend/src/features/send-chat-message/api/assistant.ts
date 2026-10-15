import type { ChatMessage, Conversation, MessageBlock } from '@/entities/conversation';

/**
 * AssistantGateway (api-contracts.md §3). Production: `POST /conversations/:id/messages` returns
 * an SSE stream of these events and the server persists the reply and debits credits.
 * Demo: `mock-assistant.ts` (canned scenarios, simulated streaming — never presented as real AI).
 */
export type AssistantEvent =
  | { type: 'block-start'; block: MessageBlock }
  | { type: 'text-delta'; delta: string }
  | { type: 'done'; message: ChatMessage };

export type ReplyInput = {
  conversation: Conversation;
  /** The user's message (already saved) */
  text: string;
};

export interface AssistantGateway {
  /** Throws ApiError (NETWORK, ABORTED, …). Out of credits is answered with a notice block. */
  reply(input: ReplyInput, signal?: AbortSignal): AsyncIterable<AssistantEvent>;
}
