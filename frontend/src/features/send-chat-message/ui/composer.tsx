'use client';

import { ArrowUp, Mic } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/shared/lib';
import { speechLang, useSpeechServices } from '@/shared/lib/speech';
import { useVoiceInput } from '../model/use-voice-input';
import { VoiceErrorNotice } from './voice-error-notice';
import { VoiceRecorderBar } from './voice-recorder-bar';

const MAX_LENGTH = 1000;
const MAX_ROWS_HEIGHT = 168; // ~6 lines, then the textarea scrolls

type ComposerProps = {
  onSend: (text: string) => void;
  /** Character name for the placeholder, e.g. "Ask Arif…" */
  characterName: string;
  disabled?: boolean;
  /** Hide the "can make mistakes" line (e.g. inside compact panels) */
  hideDisclaimer?: boolean;
  /** Larger welcome-screen variant */
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * Message composer: grows with the text, Enter sends, Shift+Enter adds a line.
 * Voice input (P-005): the mic records only after a click; the recognized speech is inserted
 * as editable text and is never sent automatically. Esc cancels a recording.
 */
export function Composer({
  onSend,
  characterName,
  disabled = false,
  hideDisclaimer = false,
  size = 'md',
  className,
}: ComposerProps) {
  const t = useTranslations('chat');
  const tv = useTranslations('voice.input');
  const locale = useLocale();
  const { input } = useSpeechServices();
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const trimmed = text.trim();

  const voice = useVoiceInput({
    provider: input,
    lang: speechLang(locale),
    onTranscript: (spoken) => {
      setText((current) => (current.trim() ? `${current.trimEnd()} ${spoken}` : spoken).slice(0, MAX_LENGTH));
      // Let the user review/edit before sending
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    },
  });
  const listening = voice.state.status === 'starting' || voice.state.status === 'recording';
  // After cancelling, return keyboard focus to the mic button that started the recording
  const cancelRecording = () => {
    voice.cancel();
    requestAnimationFrame(() => micRef.current?.focus());
  };
  const canSend = trimmed.length > 0 && !disabled && !listening;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_HEIGHT)}px`;
  }, [text, listening]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setText('');
    ref.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && listening) {
          e.preventDefault();
          cancelRecording();
        }
      }}
      className={cn('flex flex-col gap-2', className)}
    >
      <div
        className={cn(
          'border-border bg-surface focus-within:border-focus focus-within:ring-focus/25 flex items-end gap-1.5 border shadow-md transition-[border-color,box-shadow] focus-within:ring-3',
          size === 'lg' ? 'rounded-[2rem] p-2.5 ps-5' : 'rounded-[1.75rem] p-2 ps-4',
          listening && 'border-primary/40',
        )}
      >
        {listening ? (
          <VoiceRecorderBar
            state={voice.state as Extract<typeof voice.state, { status: 'starting' | 'recording' }>}
            onStop={voice.stop}
            onCancel={cancelRecording}
          />
        ) : (
          <>
            <label htmlFor={inputId} className="sr-only">
              {t('composerLabel', { name: characterName })}
            </label>
            <textarea
              id={inputId}
              ref={ref}
              rows={1}
              dir="auto"
              value={text}
              maxLength={MAX_LENGTH}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('composerPlaceholder', { name: characterName })}
              className={cn(
                'text-fg placeholder:text-fg-muted max-h-42 min-h-11 flex-1 resize-none bg-transparent py-2.5 leading-6 outline-none disabled:opacity-60',
                size === 'lg' ? 'text-base' : 'text-[0.9375rem]',
              )}
            />
            <button
              ref={micRef}
              type="button"
              onClick={voice.start}
              disabled={disabled}
              aria-label={tv('start')}
              title={tv('start')}
              className="focus-ring text-fg-secondary hover:bg-surface-muted hover:text-primary grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition-colors disabled:opacity-50"
            >
              <Mic className="size-5" aria-hidden />
            </button>
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t('send')}
              title={t('send')}
              className="focus-ring bg-cta text-on-cta shadow-glow grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition-[opacity,transform] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <ArrowUp className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {voice.state.status === 'error' && <VoiceErrorNotice code={voice.state.code} onDismiss={voice.dismissError} />}

      {!hideDisclaimer && <p className="type-caption text-fg-muted text-center">{t('disclaimer')}</p>}
    </form>
  );
}
