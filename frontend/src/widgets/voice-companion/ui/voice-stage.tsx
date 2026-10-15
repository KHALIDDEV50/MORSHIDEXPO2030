'use client';

import {
  ArrowLeft,
  Captions,
  CaptionsOff,
  LoaderCircle,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  SendHorizontal,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';
import { CHARACTERS, CharacterStage, type CharacterId } from '@/entities/ai-character';
import { cn } from '@/shared/lib';
import { DemoBadge } from '@/shared/ui';
import type { VoiceError, VoicePhase, VoiceTurn } from '../model/use-voice-conversation';
import { VoiceVisualizer } from './voice-visualizer';

export type VoiceStageProps = {
  character: CharacterId;
  phase: VoicePhase;
  error: VoiceError | null;
  levels: number[] | null;
  interim: string;
  turns: VoiceTurn[];
  draft: string;
  muted: boolean;
  canReplay: boolean;
  showTranscript: boolean;
  /** Character switcher element (feature), rendered in the top bar */
  switcher?: ReactNode;
  /** Small, non-interactive preview tile (gallery state board) */
  preview?: boolean;
  onDraftChange?: (text: string) => void;
  onExit?: () => void;
  onToggleTranscript?: () => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onCancelListening?: () => void;
  onSend?: () => void;
  onDiscard?: () => void;
  onToggleMute?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStopSpeech?: () => void;
  onReplay?: () => void;
  onDismissError?: () => void;
  className?: string;
};

const ctrl =
  'focus-ring grid shrink-0 cursor-pointer place-items-center rounded-full transition-[background-color,box-shadow,transform,opacity] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Voice Conversation Mode layout (P-011): character as the visual anchor, a live sound orb,
 * a clear status line, a readable caption/transcript, and large accessible controls.
 * Presentational: all behavior comes from `useVoiceConversation`.
 */
export function VoiceStage(props: VoiceStageProps) {
  const {
    character,
    phase,
    error,
    levels,
    interim,
    turns,
    draft,
    muted,
    canReplay,
    showTranscript,
    switcher,
    preview = false,
    className,
  } = props;
  const t = useTranslations('voiceMode');
  const tc = useTranslations('characters');
  const tv = useTranslations('voice');
  const draftId = useId();
  const accent = CHARACTERS[character].accent;
  const name = tc(`${character}.name`);
  const lastAssistant = [...turns].reverse().find((x) => x.role === 'assistant');
  const listening = phase === 'listening' || phase === 'starting';
  const speaking = phase === 'speaking' || phase === 'paused';

  const statusKey = muted && (phase === 'idle' || phase === 'review') ? 'muted' : phase;

  return (
    <div className={cn('bg-chat text-fg relative isolate flex h-full min-h-0 flex-col overflow-hidden', className)}>
      {/* Atmosphere: character tint + faint brand glow behind the stage */}
      <div className={cn('pointer-events-none absolute start-1/2 top-[18%] -z-10 size-[34rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl rtl:translate-x-1/2', accent.tint)} aria-hidden />
      <div className="bg-brand-gradient pointer-events-none absolute start-1/2 top-[42%] -z-10 h-40 w-[28rem] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl rtl:translate-x-1/2 dark:opacity-20" aria-hidden />

      {/* Top bar */}
      <div className={cn('flex shrink-0 items-center justify-between gap-2 px-3 pt-3 sm:px-5', preview && 'pointer-events-none')}>
        <button type="button" onClick={props.onExit} className={cn(ctrl, 'border-border bg-surface/70 text-fg h-10 w-auto gap-1.5 border px-3 text-sm font-medium backdrop-blur-sm hover:bg-surface')} tabIndex={preview ? -1 : undefined}>
          <ArrowLeft className="flip-rtl size-4" aria-hidden />
          <span>{t('exit')}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onToggleTranscript}
            aria-pressed={showTranscript}
            aria-label={showTranscript ? t('hideTranscript') : t('showTranscript')}
            title={showTranscript ? t('hideTranscript') : t('showTranscript')}
            className={cn(ctrl, 'border-border bg-surface/70 size-10 border backdrop-blur-sm hover:bg-surface')}
            tabIndex={preview ? -1 : undefined}
          >
            {showTranscript ? <CaptionsOff className="size-5" aria-hidden /> : <Captions className="size-5" aria-hidden />}
          </button>
          {!preview && switcher}
        </div>
      </div>

      {/* Stage */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 overflow-y-auto px-4 py-3 text-center">
        <CharacterStage id={character} className={preview ? 'w-28' : 'w-40 sm:w-52'} />
        <h2 className={cn(preview ? 'type-h3' : 'type-h1', accent.text)}>{name}</h2>
        <p className="type-caption text-fg-muted">{tc(`${character}.role`)}</p>

        <VoiceVisualizer phase={phase} levels={levels} accent={character} className="mt-2" />

        <p
          className={cn(
            'mt-1 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold',
            phase === 'listening' && 'bg-primary-tint text-primary glow-blue',
            phase === 'speaking' && 'bg-pink-tint text-accent-pink',
            phase === 'error' && 'bg-warning-tint text-warning-fg',
            !['listening', 'speaking', 'error'].includes(phase) && 'bg-surface-muted text-fg-secondary',
          )}
          role="status"
          aria-live="polite"
        >
          {(phase === 'starting' || phase === 'thinking') && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {t(`status.${statusKey}`, { name })}
        </p>

        {/* Caption: live speech, the reply being spoken, or the editable heard text */}
        <div className="mt-3 w-full max-w-xl" dir="auto">
          {phase === 'listening' && (
            <p className="type-body-lg text-fg min-h-7">{interim || <span className="text-fg-muted">{t('speakNow')}</span>}</p>
          )}
          {speaking && lastAssistant && (
            <p className="type-body-lg text-fg line-clamp-4">{lastAssistant.text}</p>
          )}
          {phase === 'review' && (
            <div className="border-border bg-surface/80 flex flex-col gap-2 rounded-xl border p-3 text-start shadow-md backdrop-blur-sm">
              <label htmlFor={draftId} className="type-caption text-fg-muted">
                {t('reviewLabel')}
              </label>
              <textarea
                id={draftId}
                value={draft}
                dir="auto"
                rows={2}
                readOnly={preview}
                onChange={(e) => props.onDraftChange?.(e.target.value)}
                className="text-fg focus-visible:ring-focus/30 w-full resize-none rounded-md bg-transparent text-base leading-7 outline-none focus-visible:ring-2"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={props.onDiscard} className={cn(ctrl, 'text-fg-secondary hover:bg-surface-muted h-9 w-auto gap-1.5 px-3 text-sm font-medium')} tabIndex={preview ? -1 : undefined}>
                  <X className="size-4" aria-hidden />
                  {t('discard')}
                </button>
                <button type="button" onClick={props.onStartListening} className={cn(ctrl, 'text-fg-secondary hover:bg-surface-muted h-9 w-auto gap-1.5 px-3 text-sm font-medium')} tabIndex={preview ? -1 : undefined}>
                  <RotateCcw className="size-4" aria-hidden />
                  {t('retry')}
                </button>
                <button type="button" onClick={props.onSend} disabled={!draft.trim()} className={cn(ctrl, 'bg-cta text-on-cta shadow-glow h-9 w-auto gap-1.5 px-4 text-sm font-bold')} tabIndex={preview ? -1 : undefined}>
                  <SendHorizontal className="flip-rtl size-4" aria-hidden />
                  {t('send', { name })}
                </button>
              </div>
            </div>
          )}
          {phase === 'error' && error && (
            <div role="alert" className="border-warning/40 bg-warning-tint flex items-start gap-3 rounded-xl border p-3 text-start">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-bold">
                  {error.source === 'input' ? tv(`input.errors.${error.code}.title`) : tv(`output.errors.${error.code}.title`)}
                </p>
                <p className="type-body-sm text-fg-secondary font-normal">
                  {error.source === 'input' ? tv(`input.errors.${error.code}.body`) : tv(`output.errors.${error.code}.body`)}
                </p>
                {error.source === 'output' && lastAssistant && (
                  <p className="type-body text-fg mt-1" dir="auto">
                    {lastAssistant.text}
                  </p>
                )}
              </div>
              <button type="button" onClick={props.onDismissError} aria-label={tv('input.dismiss')} className={cn(ctrl, 'text-fg-muted hover:text-fg size-8')} tabIndex={preview ? -1 : undefined}>
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {showTranscript && (
        <section aria-label={t('transcript')} className="border-border bg-surface/80 mx-3 mb-2 max-h-44 shrink-0 overflow-y-auto rounded-xl border p-3 backdrop-blur-sm sm:mx-auto sm:w-full sm:max-w-xl">
          {turns.length === 0 ? (
            <p className="type-body-sm text-fg-muted font-normal">{t('transcriptEmpty')}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {turns.map((turn) => (
                <li key={turn.id} className="flex flex-col">
                  <span className={cn('text-xs font-bold', turn.role === 'user' ? 'text-fg-secondary' : accent.text)}>
                    {turn.role === 'user' ? t('you') : name}
                    {turn.role === 'assistant' && <span className="text-fg-muted ms-1.5 font-medium">· {t('demoReply')}</span>}
                  </span>
                  <span className="type-body-sm text-fg font-normal" dir="auto">
                    {turn.text}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Controls */}
      <div className={cn('flex shrink-0 flex-col items-center gap-2 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]', preview && 'pointer-events-none')}>
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={props.onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? t('unmute') : t('mute')}
            title={muted ? t('unmute') : t('mute')}
            className={cn(ctrl, 'border-border size-12 border', muted ? 'bg-error-tint text-error-fg border-error/40' : 'bg-surface/80 text-fg hover:bg-surface')}
            tabIndex={preview ? -1 : undefined}
          >
            {muted ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
          </button>

          {listening ? (
            <button
              type="button"
              onClick={props.onStopListening}
              disabled={phase === 'starting'}
              aria-label={t('stopListening')}
              title={t('stopListening')}
              className={cn(ctrl, 'bg-primary text-primary-fg glow-blue size-18')}
              tabIndex={preview ? -1 : undefined}
            >
              {phase === 'starting' ? <LoaderCircle className="size-7 animate-spin" aria-hidden /> : <Square className="size-6 fill-current" aria-hidden />}
            </button>
          ) : (
            <button
              type="button"
              onClick={props.onStartListening}
              disabled={muted || phase === 'thinking'}
              aria-label={t('startListening', { name })}
              title={t('startListening', { name })}
              className={cn(ctrl, 'bg-cta text-on-cta shadow-glow size-18')}
              tabIndex={preview ? -1 : undefined}
            >
              <Mic className="size-7" aria-hidden />
            </button>
          )}

          {speaking ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={phase === 'speaking' ? props.onPause : props.onResume}
                aria-label={phase === 'speaking' ? tv('output.pause') : tv('output.resume')}
                title={phase === 'speaking' ? tv('output.pause') : tv('output.resume')}
                className={cn(ctrl, 'border-accent-pink/40 bg-pink-tint text-accent-pink size-12 border')}
                tabIndex={preview ? -1 : undefined}
              >
                {phase === 'speaking' ? <Pause className="size-5" aria-hidden /> : <Play className="flip-rtl size-5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={props.onStopSpeech}
                aria-label={tv('output.stop')}
                title={tv('output.stop')}
                className={cn(ctrl, 'border-border bg-surface/80 text-fg size-10 border')}
                tabIndex={preview ? -1 : undefined}
              >
                <Square className="size-4" aria-hidden />
              </button>
            </div>
          ) : listening ? (
            <button
              type="button"
              onClick={props.onCancelListening}
              aria-label={tv('input.cancel')}
              title={tv('input.cancel')}
              className={cn(ctrl, 'border-border bg-surface/80 text-fg size-12 border')}
              tabIndex={preview ? -1 : undefined}
            >
              <X className="size-5" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={props.onReplay}
              disabled={!canReplay}
              aria-label={t('replay')}
              title={t('replay')}
              className={cn(ctrl, 'border-border bg-surface/80 text-fg size-12 border hover:bg-surface')}
              tabIndex={preview ? -1 : undefined}
            >
              <Volume2 className="size-5" aria-hidden />
            </button>
          )}
        </div>
        <DemoBadge label={t('demoNote')} />
      </div>
    </div>
  );
}
