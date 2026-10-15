'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterId } from '@/entities/ai-character';
import { detectSpeechLang } from '@/features/listen-to-message';
import { useVoiceInput } from '@/features/send-chat-message';
import { usePlaybackSnapshot, useSpeechServices, type VoiceInputErrorCode, type VoiceOutputErrorCode } from '@/shared/lib/speech';

export type VoicePhase = 'idle' | 'starting' | 'listening' | 'review' | 'thinking' | 'speaking' | 'paused' | 'error';

export type VoiceTurn = { id: string; role: 'user' | 'assistant'; text: string };

export type VoiceError =
  | { source: 'input'; code: VoiceInputErrorCode }
  | { source: 'output'; code: VoiceOutputErrorCode };

/**
 * Voice conversation loop (P-011): listen → review (editable, user sends) → thinking → speaking.
 * - The microphone opens only on an explicit tap; muting blocks listening entirely.
 * - Recognized text is never sent automatically.
 * - Replies come from `getReply` (the mock assistant today, the real AssistantGateway later).
 * - Speech goes through the shared playback controller, so only one reply plays at a time.
 */
export function useVoiceConversation({
  character,
  lang,
  getReply,
  thinkingMs = 1200,
}: {
  character: CharacterId;
  lang: string;
  getReply: (userText: string) => string;
  thinkingMs?: number;
}) {
  const { input, playback } = useSpeechServices();
  const snapshot = usePlaybackSnapshot();
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const [replyId, setReplyId] = useState<string | null>(null);
  /** Error the user dismissed (so it doesn't reappear until a new playback attempt) */
  const [dismissedOutputError, setDismissedOutputError] = useState(false);

  const voice = useVoiceInput({ provider: input, lang, onTranscript: (text) => setDraft(text) });

  // Track playback of the latest reply (errors fall back to the text transcript)
  const speakingThis = replyId !== null && snapshot.activeId === replyId;
  const outputError: VoiceOutputErrorCode | null =
    !dismissedOutputError && snapshot.error && snapshot.error.id === replyId ? snapshot.error.code : null;

  const phase: VoicePhase = (() => {
    if (voice.state.status === 'error') return 'error';
    if (outputError) return 'error';
    if (voice.state.status === 'starting') return 'starting';
    if (voice.state.status === 'recording') return 'listening';
    if (thinking) return 'thinking';
    if (speakingThis) return snapshot.status === 'paused' ? 'paused' : 'speaking';
    if (draft) return 'review';
    return 'idle';
  })();

  const error: VoiceError | null =
    voice.state.status === 'error'
      ? { source: 'input', code: voice.state.code }
      : outputError
        ? { source: 'output', code: outputError }
        : null;

  const speak = useCallback(
    (id: string, text: string) => {
      setDismissedOutputError(false); // a new attempt may surface a new error
      playback.play(id, text, { lang: detectSpeechLang(text), character });
    },
    [playback, character],
  );

  const startListening = useCallback(() => {
    if (muted) return;
    playback.stop(); // never listen while a reply is speaking
    setDismissedOutputError(true);
    setDraft('');
    voice.start();
  }, [muted, playback, voice]);

  /** The only path that sends: an explicit user action. */
  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setTurns((t) => [...t, { id: `u-${Date.now()}`, role: 'user', text }]);
    setDraft('');
    setThinking(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const reply = getReply(text);
      const id = `a-${Date.now()}`;
      setReplyId(id);
      setTurns((t) => [...t, { id, role: 'assistant', text: reply }]);
      setThinking(false);
      speak(id, reply);
    }, thinkingMs);
  }, [draft, getReply, speak, thinkingMs]);

  const replayLast = useCallback(() => {
    const last = [...turns].reverse().find((t) => t.role === 'assistant');
    if (last) {
      setReplyId(last.id);
      speak(last.id, last.text);
    }
  }, [turns, speak]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) voice.cancel(); // muting closes the microphone immediately
      return !m;
    });
  }, [voice]);

  const dismissError = useCallback(() => {
    voice.dismissError();
    setDismissedOutputError(true);
  }, [voice]);

  /** Stop everything (exit, character switch). */
  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    voice.cancel();
    playback.stop();
    setThinking(false);
    setDraft('');
    setTurns([]);
    setDismissedOutputError(true);
    setReplyId(null);
  }, [voice, playback]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return {
    phase,
    error,
    turns,
    draft,
    setDraft,
    muted,
    levels: voice.state.status === 'recording' ? voice.state.levels : null,
    interim: voice.state.status === 'recording' ? voice.state.interim : '',
    canReplay: turns.some((t) => t.role === 'assistant'),
    startListening,
    stopListening: voice.stop,
    cancelListening: voice.cancel,
    send,
    discardDraft: () => setDraft(''),
    toggleMute,
    pauseSpeech: () => playback.pause(),
    resumeSpeech: () => playback.resume(),
    stopSpeech: () => playback.stop(),
    replayLast,
    dismissError,
    reset,
  };
}

export type VoiceConversation = ReturnType<typeof useVoiceConversation>;
