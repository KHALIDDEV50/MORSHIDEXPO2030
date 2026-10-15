'use client';

import { AudioLines } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useCallback, useRef, useState } from 'react';
import type { CharacterId } from '@/entities/ai-character';
import { CharacterSwitcher } from '@/features/switch-ai-character';
import { cn } from '@/shared/lib';
import { speechLang } from '@/shared/lib/speech';
import { useVoiceConversation } from '../model/use-voice-conversation';
import { VoiceStage } from './voice-stage';

/** "Voice mode" entry point for the chat header / composer area. */
export function VoiceModeButton({ onClick, className, compact = false }: { onClick: () => void; className?: string; compact?: boolean }) {
  const t = useTranslations('voiceMode');
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('open')}
      title={t('open')}
      className={cn(
        'focus-ring border-border bg-surface text-fg hover:border-primary/40 inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium shadow-sm transition-colors',
        compact && 'w-10 justify-center px-0',
        className,
      )}
    >
      <AudioLines className="text-primary size-4.5" aria-hidden />
      {!compact && t('openShort')}
    </button>
  );
}

/**
 * Full-screen Voice Conversation Mode (P-011) in an accessible dialog:
 * focus is trapped inside, Esc or "Back to chat" exits, and exiting stops the microphone and speech.
 * Switching character starts a fresh voice session so voice, language and conversation stay consistent.
 */
export function VoiceCompanion({
  open,
  onOpenChange,
  character,
  onCharacterChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: CharacterId;
  onCharacterChange: (next: CharacterId) => void;
}) {
  const t = useTranslations('voiceMode');
  const tc = useTranslations('characters');
  const locale = useLocale();
  const [showTranscript, setShowTranscript] = useState(false);
  const replyIndex = useRef(0);

  const getReply = useCallback(() => {
    const keys = ['r1', 'r2', 'r3'] as const;
    const key = keys[replyIndex.current % keys.length] as (typeof keys)[number];
    replyIndex.current += 1;
    return t(`demoReplies.${character}.${key}`);
  }, [t, character]);

  const conversation = useVoiceConversation({ character, lang: speechLang(locale), getReply });

  const close = (next: boolean) => {
    if (!next) conversation.reset();
    onOpenChange(next);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={close}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="z-modal bg-overlay animate-fade-in fixed inset-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="z-modal animate-fade-in fixed inset-0 outline-none sm:inset-4 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-border sm:shadow-lg"
          onEscapeKeyDown={(e) => {
            // Esc first cancels an active recording; a second Esc exits voice mode
            if (conversation.phase === 'listening' || conversation.phase === 'starting') {
              e.preventDefault();
              conversation.cancelListening();
            }
          }}
        >
          <DialogPrimitive.Title className="sr-only">{t('dialogTitle', { name: tc(`${character}.name`) })}</DialogPrimitive.Title>
          <VoiceStage
            character={character}
            phase={conversation.phase}
            error={conversation.error}
            levels={conversation.levels}
            interim={conversation.interim}
            turns={conversation.turns}
            draft={conversation.draft}
            muted={conversation.muted}
            canReplay={conversation.canReplay}
            showTranscript={showTranscript}
            switcher={
              <CharacterSwitcher
                active={character}
                onSwitch={(next) => {
                  conversation.reset();
                  onCharacterChange(next);
                }}
              />
            }
            onDraftChange={conversation.setDraft}
            onExit={() => close(false)}
            onToggleTranscript={() => setShowTranscript((s) => !s)}
            onStartListening={conversation.startListening}
            onStopListening={conversation.stopListening}
            onCancelListening={conversation.cancelListening}
            onSend={conversation.send}
            onDiscard={conversation.discardDraft}
            onToggleMute={conversation.toggleMute}
            onPause={conversation.pauseSpeech}
            onResume={conversation.resumeSpeech}
            onStopSpeech={conversation.stopSpeech}
            onReplay={conversation.replayLast}
            onDismissError={conversation.dismissError}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
