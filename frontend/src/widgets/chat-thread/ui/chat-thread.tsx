'use client';

import { CircleStop, User, WifiOff } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';
import { CharacterAvatar, type CharacterId } from '@/entities/ai-character';
import { MessageBubble, TypingIndicator, type ChatMessage, type MessageBlock } from '@/entities/conversation';
import { SpeakButton } from '@/features/listen-to-message';
import { Composer, useStopRefs, type useChatSession } from '@/features/send-chat-message';
import { cn } from '@/shared/lib';
import { useOnline } from '@/shared/lib/use-online';
import { Button } from '@/shared/ui';
import { MarkdownLite } from './markdown-lite';
import { NoticeBlock } from './notice-block';
import { ProposalCard } from './proposal-card';
import { RecommendationList } from './recommendation-list';

type Session = ReturnType<typeof useChatSession>;

type ChatThreadProps = {
  session: Session;
  /** The conversation's character (or the active one for a new conversation) */
  character: CharacterId;
  /** Shown instead of the message list when the conversation is empty */
  welcome?: ReactNode;
  /** Header above the messages (assistant header, toggles …) */
  header?: ReactNode;
  onShowOnMap?: (messageId: string, focusId?: string) => void;
  onReviewProposal?: (messageId: string) => void;
  onOpenPlan: (planId: string) => void;
  /** Docked / floating panels: smaller avatars, no image thumbnails, no disclaimer */
  compact?: boolean;
  className?: string;
};

const textOf = (blocks: MessageBlock[]) => blocks.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n\n');

/**
 * A conversation: messages with structured blocks (text, recommendations, itinerary proposal,
 * notices), simulated streaming with Stop, error + Retry, an offline notice, and the composer.
 */
export function ChatThread({ session, character, welcome, header, onShowOnMap, onReviewProposal, onOpenPlan, compact = false, className }: ChatThreadProps) {
  const t = useTranslations('chatThread');
  const tc = useTranslations('characters');
  const format = useFormatter();
  const online = useOnline();
  const { resolve } = useStopRefs();
  const name = tc(`${character}.name`);
  const scroller = useRef<HTMLDivElement>(null);
  const { messages, pending, failed } = session;
  const empty = messages.length === 0 && !pending && !session.loading;

  // Follow new content while the reader is at (or near) the bottom
  const lastKey = `${messages.length}:${pending?.text.length ?? 0}:${pending?.blocks.length ?? 0}:${pending?.phase ?? ''}`;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) el.scrollTo({ top: el.scrollHeight });
  }, [lastKey]);

  const time = (iso: string) => format.dateTime(new Date(iso), { hour: 'numeric', minute: '2-digit' });
  const avatarSize = compact ? 'sm' : 'md';
  const assistantAvatar = <CharacterAvatar id={character} size={avatarSize} decorative />;
  const userAvatar = (
    <span className={cn('bg-surface-muted text-fg-secondary grid shrink-0 place-items-center rounded-full', compact ? 'size-8' : 'size-10')} aria-hidden>
      <User className="size-4" />
    </span>
  );
  const ask = (placeName: string) => void session.send(t('followUpPrompt', { name: placeName }));

  const renderBlocks = (messageId: string, blocks: MessageBlock[]) =>
    blocks.map((block, i) => {
      if (block.type === 'text') return null;
      if (block.type === 'notice') return <NoticeBlock key={i} notice={block} />;
      if (block.type === 'recommendations') {
        return (
          <RecommendationList
            key={i}
            items={block.items}
            resolve={resolve}
            compact={compact}
            onAsk={ask}
            onShowOnMap={onShowOnMap ? (id) => onShowOnMap(messageId, id) : undefined}
          />
        );
      }
      return (
        <ProposalCard
          key={i}
          proposal={block.proposal}
          conversationId={session.conversation?.id ?? null}
          resolve={resolve}
          onReview={onReviewProposal ? () => onReviewProposal(messageId) : undefined}
          onShowOnMap={onShowOnMap ? () => onShowOnMap(messageId) : undefined}
          onOpenPlan={onOpenPlan}
        />
      );
    });

  const lastUserId = [...messages].reverse().find((m) => m.role === 'user')?.id;

  const renderMessage = (m: ChatMessage) => {
    const text = textOf(m.blocks);
    const isUser = m.role === 'user';
    const errored = isUser && failed !== null && m.id === lastUserId;
    const extra = isUser ? null : renderBlocks(m.id, m.blocks);
    return (
      <li key={m.id} className="flex flex-col gap-2">
        {(text || isUser) && (
          <MessageBubble
            role={m.role}
            author={isUser ? t('you') : name}
            accent={character}
            time={time(m.createdAt)}
            avatar={isUser ? userAvatar : assistantAvatar}
            status={errored ? 'error' : 'done'}
            onRetry={errored ? session.retry : undefined}
            footer={!isUser && text ? <SpeakButton messageId={m.id} text={text} character={character} characterName={name} /> : undefined}
          >
            {isUser ? <p className="whitespace-pre-line">{text}</p> : <MarkdownLite text={text} />}
          </MessageBubble>
        )}
        {extra && <div className={cn('flex flex-col gap-2', compact ? 'ps-11' : 'ps-13')}>{extra}</div>}
      </li>
    );
  };

  return (
    <section aria-label={t('label', { name })} className={cn('bg-background flex min-h-0 flex-1 flex-col', className)}>
      {header}
      {!online && (
        <p role="status" className="bg-warning-tint text-warning-fg flex items-center justify-center gap-2 px-4 py-2 text-sm">
          <WifiOff className="size-4" aria-hidden />
          {t('offline')}
        </p>
      )}

      {empty && welcome ? (
        <div className="flex min-h-0 flex-1 flex-col">{welcome}</div>
      ) : (
        <>
          <div ref={scroller} className={cn('min-h-0 flex-1 overflow-y-auto', compact ? 'px-3 py-4' : 'px-4 py-6 sm:px-8')}>
            <ol className="mx-auto flex w-full max-w-3xl flex-col gap-5" aria-live="polite" aria-relevant="additions">
              {session.loading && <li className="text-fg-muted text-center text-sm">{t('loading')}</li>}
              {messages.map(renderMessage)}
              {pending &&
                (pending.phase === 'thinking' ? (
                  <li className="flex items-center gap-2">
                    <TypingIndicator author={name} avatar={assistantAvatar} />
                  </li>
                ) : (
                  <li className="flex flex-col gap-2" aria-busy="true">
                    {pending.text && (
                      <MessageBubble role="assistant" author={name} accent={character} time={t('now')} avatar={assistantAvatar}>
                        <MarkdownLite text={pending.text} />
                      </MessageBubble>
                    )}
                    {pending.blocks.length > 0 && <div className={cn('flex flex-col gap-2', compact ? 'ps-11' : 'ps-13')}>{renderBlocks('pending', pending.blocks)}</div>}
                  </li>
                ))}
            </ol>
          </div>
          {pending && (
            <div className="flex justify-center pb-1">
              <Button size="sm" variant="ghost" onClick={session.stop}>
                <CircleStop aria-hidden />
                {t('stop')}
              </Button>
            </div>
          )}
          <div className={cn('border-border bg-background border-t', compact ? 'p-2.5' : 'px-4 py-3 sm:px-6')}>
            <Composer
              className="mx-auto w-full max-w-3xl"
              characterName={name}
              onSend={(text) => void session.send(text)}
              disabled={session.busy || !online}
              hideDisclaimer={compact}
            />
          </div>
        </>
      )}
    </section>
  );
}
