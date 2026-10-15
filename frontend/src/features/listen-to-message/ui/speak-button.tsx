'use client';

import { Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { cn } from '@/shared/lib';
import { usePlaybackSnapshot, useSpeechServices, warmUpVoices } from '@/shared/lib/speech';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui';
import { detectSpeechLang } from '../model/detect-lang';

// Browser voices load asynchronously: re-check support once the voice list arrives.
const subscribeVoices = (onChange: () => void) => {
  warmUpVoices(onChange);
  return () => {};
};

const pill =
  'focus-ring inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors [&_svg]:size-3.5';

/**
 * Listen / pause / resume / stop for one assistant message (P-005).
 * Only one message speaks at a time (shared playback controller).
 * The voice is the device's text-to-speech — labelled as a demo, never as Arif's or Roaya's own voice.
 */
export function SpeakButton({
  messageId,
  text,
  character,
  characterName,
}: {
  messageId: string;
  /** Plain text of the message */
  text: string;
  character: 'arif' | 'roaya';
  characterName: string;
}) {
  const t = useTranslations('voice.output');
  const { playback } = useSpeechServices();
  const snapshot = usePlaybackSnapshot();
  const lang = detectSpeechLang(text);
  // Capability is only known in the browser; assume supported during SSR to avoid layout shift.
  const support = useSyncExternalStore(
    subscribeVoices,
    () => playback.provider.support(lang).supported,
    () => true,
  );

  const isActive = snapshot.activeId === messageId;
  const status = isActive ? snapshot.status : 'idle';
  const unsupportedReason = (() => {
    if (support) return null;
    const result = playback.provider.support(lang);
    return result.supported ? null : result.reason;
  })();
  const errorCode = snapshot.error?.id === messageId ? snapshot.error.code : unsupportedReason;

  if (errorCode) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn(pill, 'text-fg-muted hover:bg-surface-muted')} aria-label={t('unavailableLabel')}>
            <VolumeX aria-hidden />
            {t('unavailable')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="type-body-sm text-fg-secondary font-normal">
          <p className="text-fg mb-1 font-bold">{t(`errors.${errorCode}.title`)}</p>
          {t(`errors.${errorCode}.body`)}
        </PopoverContent>
      </Popover>
    );
  }

  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={() => playback.play(messageId, text, { lang, character })}
        className={cn(pill, 'text-fg-secondary hover:bg-surface-muted hover:text-fg')}
        aria-label={t('listenLabel', { name: characterName })}
        title={t('demoVoiceNote')}
      >
        <Volume2 aria-hidden />
        {t('listen')}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('controlsLabel')}>
      {status === 'playing' ? (
        <button
          type="button"
          onClick={() => playback.pause()}
          className={cn(pill, 'bg-primary-tint text-primary')}
          aria-label={playback.provider.canPause ? t('pause') : t('stop')}
        >
          <Pause aria-hidden />
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {[0, 120, 240].map((d) => (
              <span key={d} className="bg-primary w-[2px] animate-pulse rounded-full" style={{ height: `${50 + d / 6}%`, animationDelay: `${d}ms` }} />
            ))}
          </span>
          {t('playing')}
        </button>
      ) : (
        <button type="button" onClick={() => playback.resume()} className={cn(pill, 'bg-primary-tint text-primary')} aria-label={t('resume')}>
          <Play className="flip-rtl" aria-hidden />
          {t('resume')}
        </button>
      )}
      <button
        type="button"
        onClick={() => playback.stop()}
        className={cn(pill, 'text-fg-secondary hover:bg-surface-muted w-8 justify-center px-0')}
        aria-label={t('stop')}
        title={t('stop')}
      >
        <Square aria-hidden />
      </button>
      <span className="type-caption text-fg-muted ps-1">{t('demoVoice')}</span>
      <span className="sr-only" aria-live="polite">
        {status === 'playing' ? t('nowPlaying', { name: characterName }) : t('paused')}
      </span>
    </div>
  );
}
