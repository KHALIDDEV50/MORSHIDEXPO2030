'use client';

import { Clock, ExternalLink, History, Lightbulb, MapPinned, Maximize2, MessageCircle, Minimize2, Route, Sparkles, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AssistantHeader, CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import type { ConversationContext } from '@/entities/conversation';
import { Composer, useChatSession } from '@/features/send-chat-message';
import { useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { Button, IconButton, Tooltip } from '@/shared/ui';
import { ChatThread } from './chat-thread';

export type DockSuggestion = { key: string; icon: ReactNode; text: string };

/** A message to send as soon as the dock is open (e.g. an interest chip on the Expo page). */
export type DockPrompt = { id: number; text: string };

const contextKey = (c: ConversationContext) => (c.kind === 'place' ? `place:${c.placeId}` : c.kind === 'booth' ? `booth:${c.boothId}` : c.kind);

type ChatDockProps = {
  open: boolean;
  onClose: () => void;
  /** What the conversation is about; each context keeps its own conversation while the page is open */
  context: ConversationContext;
  /** Accessible name of the panel, e.g. "Chat about Hegra" */
  label: string;
  /** Chip under the header, e.g. "About: Hegra" */
  contextLabel: string;
  /** Welcome line and suggested first questions for an empty conversation */
  intro: string;
  suggestions: DockSuggestion[];
  prompt?: DockPrompt | null;
};

/**
 * Contextual chat popup (PRD §4.1/§4.2) — one implementation for place details, Expo pavilions,
 * the Expo assistant and itinerary steps. Compact: a floating panel at the bottom corner on
 * desktop, a near-full sheet on phones. "Expand" opens a larger reading view (full screen on
 * phones); "Collapse" returns to the compact panel. Both states render the same session, so the
 * conversation is never lost while switching. It never navigates away by itself.
 */
export function ChatDock({ open, onClose, context, label, contextLabel, intro, suggestions, prompt }: ChatDockProps) {
  const t = useTranslations('chatDock');
  const tc = useTranslations('characters');
  const locale = useLocale();
  const router = useRouter();
  const [character] = useActiveCharacter();
  const key = contextKey(context);
  /** Conversation per context (asking about another step starts its own conversation) */
  const [conversations, setConversations] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const sentPrompt = useRef<number | null>(null);

  const session = useChatSession({
    conversationId: conversations[key] ?? null,
    characterId: character,
    locale,
    context,
    onConversationCreated: (c) => setConversations((prev) => ({ ...prev, [key]: c.id })),
  });

  // Focus moves into the panel when it opens
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>('textarea, button')?.focus();
  }, [open, key]);

  // A prompt handed over by the page (sent once, only while open)
  const { send } = session;
  useEffect(() => {
    if (!open || !prompt || sentPrompt.current === prompt.id) return;
    sentPrompt.current = prompt.id;
    void send(prompt.text);
  }, [open, prompt, send]);

  if (!open) return null;

  const close = () => {
    setExpanded(false);
    onClose();
  };
  const name = tc(`${character}.name`);

  const welcome = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn('flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4', expanded && 'sm:px-8 sm:py-6')}>
        <div className={cn('flex flex-col gap-3', expanded && 'mx-auto w-full max-w-3xl')}>
          <p className="type-body-sm text-fg-secondary font-normal">{intro}</p>
          <ul className={cn('flex flex-col gap-2', expanded && 'sm:grid sm:grid-cols-2')} aria-label={t('suggestionsLabel')}>
            {suggestions.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => void session.send(s.text)}
                  className="focus-ring border-border bg-surface hover:bg-surface-muted flex h-full w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-start text-sm [&_svg]:size-4"
                >
                  <span className="text-primary shrink-0" aria-hidden>
                    {s.icon}
                  </span>
                  {s.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={cn('border-border border-t p-2.5', expanded && 'sm:px-6 sm:py-3')}>
        <Composer className={cn(expanded && 'mx-auto w-full max-w-3xl')} characterName={name} onSend={(text) => void session.send(text)} hideDisclaimer={!expanded} />
      </div>
    </div>
  );

  return (
    <>
      {/* The expanded view dims the page; clicking outside returns to the compact panel */}
      {expanded && <div className="z-sheet animate-fade-in fixed inset-0 bg-black/45" onClick={() => setExpanded(false)} aria-hidden />}
      <section
        ref={panel}
        role="dialog"
        aria-modal={expanded}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          e.stopPropagation();
          // Escape steps back: expanded → compact → closed
          if (expanded) setExpanded(false);
          else close();
        }}
        className={cn(
          'border-border bg-surface-elevated z-sheet animate-pop-in fixed flex flex-col overflow-hidden border shadow-2xl',
          expanded
            ? 'inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:inset-6 md:rounded-2xl md:pt-0 md:pb-0 lg:inset-x-[max(1.5rem,calc((100vw-64rem)/2))]'
            : 'inset-x-0 top-[12dvh] bottom-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)] md:inset-x-auto md:end-6 md:top-auto md:bottom-6 md:h-[min(38rem,calc(100dvh-7rem))] md:w-[26rem] md:rounded-2xl md:pb-0',
        )}
      >
        <header className="border-border flex flex-col gap-2 border-b px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <AssistantHeader id={character} className="min-w-0 flex-1" />
            <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)} aria-pressed={expanded}>
              {expanded ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
              {expanded ? t('collapse') : t('expand')}
            </Button>
            {session.conversation && (
              <IconButton
                size="icon-sm"
                variant="ghost"
                label={t('openInChat')}
                icon={<ExternalLink aria-hidden />}
                onClick={() => router.push(`/chat?c=${encodeURIComponent(session.conversation!.id)}`)}
              />
            )}
            <IconButton size="icon-sm" variant="ghost" label={t('close')} icon={<X aria-hidden />} onClick={close} />
          </div>
          <span className="bg-primary-tint text-primary inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-xs font-bold">
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            {contextLabel}
          </span>
        </header>
        <ChatThread session={session} character={character} compact={!expanded} welcome={welcome} onOpenPlan={(id) => router.push(`/plans/${id}`)} />
      </section>
    </>
  );
}

/** A guide place or Expo pavilion the visitor wants to ask about. */
export type DockTarget = { kind: 'place' | 'booth'; id: string; name: string };

/** Context, labels and suggested questions for a chat about one place or pavilion. */
export function useDockTarget(target: DockTarget) {
  const tp = useTranslations('placeChat');
  const tb = useTranslations('chatDock.booth');
  const tc = useTranslations('characters');
  const [character] = useActiveCharacter();
  const characterName = tc(`${character}.name`);
  const { name } = target;

  if (target.kind === 'booth') {
    return {
      context: { kind: 'booth', boothId: target.id } satisfies ConversationContext,
      label: tb('label', { name }),
      contextLabel: tb('context', { name }),
      intro: tb('intro', { character: characterName, name }),
      suggestions: [
        { key: 'what', icon: <Sparkles />, text: tb('suggestions.what', { name }) },
        { key: 'when', icon: <Clock />, text: tb('suggestions.when', { name }) },
        { key: 'plan', icon: <Route />, text: tb('suggestions.plan', { name }) },
      ],
    };
  }
  return {
    context: { kind: 'place', placeId: target.id } satisfies ConversationContext,
    label: tp('label', { place: name }),
    contextLabel: tp('contextChip', { place: name }),
    intro: tp('intro', { name: characterName, place: name }),
    suggestions: [
      { key: 'history', icon: <History />, text: tp('suggestions.history', { name }) },
      { key: 'focus', icon: <Lightbulb />, text: tp('suggestions.focus', { name }) },
      { key: 'nearby', icon: <MapPinned />, text: tp('suggestions.nearby', { name }) },
    ],
  };
}

/**
 * Floating entry point for the chat popup: a gradient circle at the inline-end corner on phones
 * (above the bottom nav, safe area respected) and a labelled pill on larger screens.
 */
export function ChatLauncher({ label, onOpen, hidden = false }: { label: string; onOpen: () => void; hidden?: boolean }) {
  const [character] = useActiveCharacter();
  if (hidden) return null;
  return (
    <div className="z-sticky fixed end-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] md:end-6 md:bottom-6">
      <Tooltip content={label} side="top">
        <button
          type="button"
          aria-label={label}
          onClick={onOpen}
          className="focus-ring bg-cta text-on-cta shadow-glow flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 md:size-auto md:h-14 md:ps-2 md:pe-5"
        >
          <CharacterAvatar id={character} size="sm" ring={false} decorative className="hidden md:inline-flex" />
          <MessageCircle className="size-6 md:hidden" aria-hidden />
          <span className="hidden max-w-56 truncate text-sm md:inline" aria-hidden>
            {label}
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
