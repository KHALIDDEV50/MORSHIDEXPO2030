import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema, LocalizedTextSchema, PrioritySchema, TimeSchema } from '@/shared/api';

/**
 * Conversation & assistant contracts (api-contracts.md §2). Messages are kept in the language
 * they were written in (`Conversation.locale`), like a real chat history; assistant notices and
 * proposal copy are bilingual because the app generates them.
 */
export const ConversationCharacterSchema = z.enum(['arif', 'roaya']);

export const StopRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('place'), placeId: z.string().startsWith('plc_') }),
  z.object({ kind: z.literal('booth'), boothId: z.string().startsWith('booth_') }),
]);

export const ConversationContextSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('place'), placeId: z.string() }),
  z.object({ kind: z.literal('booth'), boothId: z.string() }),
  z.object({ kind: z.literal('planner') }),
  /** The Expo assistant (Expo page): questions about the illustrative layout and visit plans */
  z.object({ kind: z.literal('expo') }),
]);

export const ProposalStopSchema = z.object({
  ref: StopRefSchema,
  order: z.number().int().nonnegative(),
  startTime: TimeSchema.optional(),
  durationMin: z.number().int().positive(),
  objective: LocalizedTextSchema.optional(),
  /** Demo ranking, not AI confidence */
  priority: PrioritySchema,
  reason: LocalizedTextSchema,
  /** false = the user removed it before saving (P-013) */
  kept: z.boolean(),
});

export const ItineraryProposalSchema = z.object({
  id: z.string().startsWith('prop_'),
  title: LocalizedTextSchema,
  type: z.enum(['tourism', 'expo']),
  date: IsoDateSchema.optional(),
  startTime: TimeSchema,
  /** Estimated buffer between stops — labelled "estimated", never a travel-time claim */
  bufferMin: z.number().int().nonnegative(),
  rationale: LocalizedTextSchema,
  stops: z.array(ProposalStopSchema),
  /** Set once saved (idempotent save, D-021) */
  savedPlanId: z.string().optional(),
});

export const MessageBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('recommendations'),
    items: z.array(z.object({ ref: StopRefSchema, priority: PrioritySchema, reason: LocalizedTextSchema })),
  }),
  z.object({ type: z.literal('itinerary-proposal'), proposal: ItineraryProposalSchema }),
  z.object({ type: z.literal('notice'), kind: z.enum(['demo', 'out_of_credits', 'error']), text: LocalizedTextSchema }),
]);

export const ChatMessageSchema = z.object({
  id: z.string().startsWith('msg_'),
  conversationId: z.string().startsWith('conv_'),
  role: z.enum(['user', 'assistant']),
  blocks: z.array(MessageBlockSchema).min(1),
  status: z.enum(['sending', 'streaming', 'done', 'error']),
  createdAt: IsoDateTimeSchema,
});

export const ConversationSchema = z.object({
  id: z.string().startsWith('conv_'),
  characterId: ConversationCharacterSchema,
  title: z.string().min(1).max(120),
  /** Language the conversation was held in (messages are shown with this lang/dir) */
  locale: z.string(),
  context: ConversationContextSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export type ConversationCharacter = z.infer<typeof ConversationCharacterSchema>;
export type StopRef = z.infer<typeof StopRefSchema>;
export type ConversationContext = z.infer<typeof ConversationContextSchema>;
export type ProposalStopData = z.infer<typeof ProposalStopSchema>;
export type ItineraryProposal = z.infer<typeof ItineraryProposalSchema>;
export type MessageBlock = z.infer<typeof MessageBlockSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationListQuery = { characterId?: ConversationCharacter; q?: string };

/** History grouping used by the chat sidebar: Today · Last 7 days · Older. */
export type HistoryGroup = 'today' | 'week' | 'older';
export function historyGroup(updatedAt: string, now: Date = new Date()): HistoryGroup {
  const d = new Date(updatedAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startOfToday) return 'today';
  if (d.getTime() >= startOfToday - 6 * 86_400_000) return 'week';
  return 'older';
}
