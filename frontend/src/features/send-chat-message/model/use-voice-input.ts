'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpeechInputProvider, SpeechInputSession, VoiceInputErrorCode } from '@/shared/lib/speech';

export type VoiceInputState =
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'recording'; level: number; levels: number[]; interim: string; startedAt: number }
  | { status: 'error'; code: VoiceInputErrorCode };

const LEVEL_HISTORY = 28;

/**
 * Voice input state machine: idle → starting → recording → (transcript | error) → idle.
 * The transcript is handed back to the composer as editable text — it is never sent automatically.
 */
export function useVoiceInput({
  provider,
  lang,
  onTranscript,
}: {
  provider: SpeechInputProvider;
  lang: string;
  onTranscript: (text: string) => void;
}) {
  const [state, setState] = useState<VoiceInputState>({ status: 'idle' });
  const session = useRef<SpeechInputSession | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const start = useCallback(() => {
    if (session.current) return;
    const support = provider.support();
    if (!support.supported) {
      setState({ status: 'error', code: support.reason });
      return;
    }
    setState({ status: 'starting' });
    let failed = false;
    session.current = provider.start(
      { lang },
      {
        onStart: () =>
          setState({ status: 'recording', level: 0, levels: Array(LEVEL_HISTORY).fill(0), interim: '', startedAt: Date.now() }),
        onLevel: (level) =>
          setState((s) =>
            s.status === 'recording' ? { ...s, level, levels: [...s.levels.slice(1), level] } : s,
          ),
        onInterim: (interim) => setState((s) => (s.status === 'recording' ? { ...s, interim } : s)),
        onResult: (text) => {
          if (text) onTranscriptRef.current(text);
          else {
            failed = true;
            setState({ status: 'error', code: 'no-speech' });
          }
        },
        onError: (code) => {
          failed = true;
          setState({ status: 'error', code });
        },
        onEnd: () => {
          session.current = null;
          if (!failed) setState({ status: 'idle' });
        },
      },
    );
  }, [provider, lang]);

  const stop = useCallback(() => session.current?.stop(), []);
  const cancel = useCallback(() => {
    session.current?.cancel();
    session.current = null;
    setState({ status: 'idle' });
  }, []);
  const dismissError = useCallback(() => setState({ status: 'idle' }), []);

  // Never keep the microphone open after the component goes away.
  useEffect(() => () => session.current?.cancel(), []);
  // A provider/language change ends any running session.
  useEffect(() => () => {
    session.current?.cancel();
    session.current = null;
  }, [provider, lang]);

  return { state, start, stop, cancel, dismissError };
}
