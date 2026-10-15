'use client';

import { Check, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib';
import type { VoiceInputState } from '../model/use-voice-input';

/** Live recording strip that replaces the text field while listening. */
export function VoiceRecorderBar({
  state,
  onStop,
  onCancel,
}: {
  state: Extract<VoiceInputState, { status: 'starting' | 'recording' }>;
  onStop: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('voice.input');
  const format = useFormatter();
  const [now, setNow] = useState(() => Date.now());
  const recording = state.status === 'recording';
  const cancelRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);

  // Keep keyboard focus inside the recorder (the mic button that had focus is gone):
  // "Cancel" while the mic starts, then "Done" once listening.
  useEffect(() => {
    (recording ? stopRef : cancelRef).current?.focus();
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [recording]);

  const seconds = recording ? Math.max(0, Math.floor((now - state.startedAt) / 1000)) : 0;
  const clock = `${format.number(Math.floor(seconds / 60), { numberingSystem: 'latn' })}:${format.number(seconds % 60, { minimumIntegerDigits: 2, numberingSystem: 'latn' })}`;
  const levels = recording ? state.levels : Array<number>(28).fill(0);

  return (
    <div className="flex min-h-11 flex-1 items-center gap-2" role="group" aria-label={t('recordingGroup')}>
      <button
        ref={cancelRef}
        type="button"
        onClick={onCancel}
        aria-label={t('cancel')}
        title={t('cancel')}
        className="focus-ring text-fg-secondary hover:bg-surface-muted hover:text-fg grid size-9 shrink-0 cursor-pointer place-items-center rounded-full"
      >
        <X className="size-5" aria-hidden />
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5 shrink-0" aria-hidden>
            <span className={cn('bg-error absolute inset-0 rounded-full', recording && 'animate-ping opacity-60')} />
            <span className="bg-error relative size-2.5 rounded-full" />
          </span>
          {/* Waveform: recent microphone levels (decorative — status is announced as text) */}
          <div className="flex h-7 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden>
            {levels.map((level, i) => (
              <span
                key={i}
                className="bg-cta w-[3px] shrink-0 rounded-full transition-[height] duration-100"
                style={{ height: `${Math.max(12, Math.round(level * 100))}%`, opacity: recording ? 0.45 + level * 0.55 : 0.3 }}
              />
            ))}
          </div>
          <span className="type-caption text-fg-secondary shrink-0 tabular-nums" dir="ltr">
            {clock}
          </span>
        </div>
        <p className="type-caption text-fg-muted truncate" aria-live="polite" dir="auto">
          {state.status === 'starting'
            ? t('starting')
            : state.interim
              ? state.interim
              : t('listening')}
        </p>
      </div>

      <button
        ref={stopRef}
        type="button"
        onClick={onStop}
        disabled={!recording}
        aria-label={t('stop')}
        title={t('stop')}
        className="focus-ring bg-primary text-primary-fg hover:bg-primary-hover grid size-11 shrink-0 cursor-pointer place-items-center rounded-full shadow-sm disabled:opacity-50"
      >
        <Check className="size-5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
