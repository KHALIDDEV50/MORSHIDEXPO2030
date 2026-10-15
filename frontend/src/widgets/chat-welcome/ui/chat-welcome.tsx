'use client';

import {
  Building,
  Compass,
  Cpu,
  Landmark,
  Route,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  CHARACTERS,
  CharacterStage,
  SUGGESTIONS,
  type CharacterId,
  type SuggestionIcon,
} from '@/entities/ai-character';
import { SuggestionCards } from '@/entities/conversation';
import { Composer } from '@/features/send-chat-message';
import { CharacterSwitcher } from '@/features/switch-ai-character';
import { cn } from '@/shared/lib';

const ICONS: Record<SuggestionIcon, ReactNode> = {
  landmark: <Landmark />,
  route: <Route />,
  food: <UtensilsCrossed />,
  compass: <Compass />,
  cpu: <Cpu />,
  ticket: <Ticket />,
  family: <Users />,
  building: <Building />,
};

/**
 * The chat "welcome" — the entrance to the companion before a conversation starts.
 * Container-responsive: phones get a compact stacked hero, swipeable cards and a composer
 * pinned to the bottom; wide containers get a side-by-side hero and a card grid.
 */
export function ChatWelcome({
  character,
  onCharacterChange,
  onSend,
  headerActions,
  className,
}: {
  character: CharacterId;
  onCharacterChange: (next: CharacterId) => void;
  onSend: (text: string) => void;
  /** Extra controls next to the character switcher (e.g. the Voice mode button) */
  headerActions?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('characters');
  const tw = useTranslations('chat.welcome');
  const name = t(`${character}.name`);
  const accent = CHARACTERS[character].accent;

  const cards = SUGGESTIONS[character].map(({ key, icon }) => ({
    key,
    icon: ICONS[icon],
    title: t(`${character}.suggestions.${key}.title`),
    hint: t(`${character}.suggestions.${key}.hint`),
    prompt: t(`${character}.suggestions.${key}.prompt`),
  }));

  return (
    <section
      aria-label={tw('label', { name })}
      className={cn('@container bg-aurora relative flex h-full min-h-0 flex-col overflow-hidden', className)}
    >
      {/* Soft accent wash anchored behind the hero (light & dark) */}
      <div
        className={cn('pointer-events-none absolute -top-24 start-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full opacity-50 blur-3xl rtl:translate-x-1/2', accent.tint)}
        aria-hidden
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-4 pt-4 pb-6 @2xl:gap-10 @2xl:px-10 @2xl:pt-6 @2xl:pb-8">
          <div className="flex items-center justify-between gap-3">
            <span className="border-border bg-surface/70 text-fg-secondary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="text-accent-pink size-3.5" aria-hidden />
              {tw('eyebrow')}
            </span>
            <div className="flex items-center gap-2">
              {headerActions}
              <CharacterSwitcher active={character} onSwitch={onCharacterChange} />
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center @2xl:flex-row @2xl:gap-10 @2xl:text-start">
            <CharacterStage id={character} className="w-44 shrink-0 @2xl:w-72 @5xl:w-80" />
            <div className="flex max-w-xl flex-col items-center gap-3 @2xl:items-start">
              <h2 className={cn('type-display', accent.text)}>{name}</h2>
              <p className="text-fg-secondary text-sm font-medium tracking-normal">{t(`${character}.role`)}</p>
              <p className="type-body-lg text-fg max-w-md">{t(`${character}.greeting`)}</p>
            </div>
          </div>

          <SuggestionCards items={cards} accent={character} onSelect={onSend} />
        </div>
      </div>

      <div className="border-border/60 bg-background/80 border-t px-4 pt-3 pb-3 backdrop-blur-md @2xl:border-0 @2xl:bg-transparent @2xl:px-10 @2xl:pb-6 @2xl:backdrop-blur-none">
        <Composer className="mx-auto w-full max-w-3xl" characterName={name} onSend={onSend} size="lg" />
      </div>
    </section>
  );
}
