import type { SpeakOptions, SpeechOutputProvider, VoiceOutputErrorCode } from './types';

export type PlaybackStatus = 'idle' | 'playing' | 'paused';

export type PlaybackSnapshot = {
  /** Message currently speaking or paused; only one at a time */
  activeId: string | null;
  status: PlaybackStatus;
  /** Last error, tied to the message that produced it */
  error: { id: string; code: VoiceOutputErrorCode } | null;
};

const IDLE: PlaybackSnapshot = { activeId: null, status: 'idle', error: null };

/**
 * Single source of truth for AI voice playback: starting one message stops any other,
 * so two messages never speak at the same time.
 */
export function createPlaybackController(provider: SpeechOutputProvider) {
  let snapshot: PlaybackSnapshot = IDLE;
  const listeners = new Set<() => void>();
  const set = (next: PlaybackSnapshot) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };

  return {
    provider,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => IDLE,

    play(id: string, text: string, options: SpeakOptions) {
      provider.stop();
      const support = provider.support(options.lang);
      if (!support.supported) {
        set({ activeId: null, status: 'idle', error: { id, code: support.reason } });
        return;
      }
      set({ activeId: id, status: 'playing', error: null });
      provider.speak(text, options, {
        onEnd: () => {
          if (snapshot.activeId === id) set(IDLE);
        },
        onError: (code) => {
          if (snapshot.activeId === id) set({ activeId: null, status: 'idle', error: { id, code } });
        },
      });
    },
    pause() {
      if (snapshot.status !== 'playing') return;
      if (!provider.canPause) {
        provider.stop();
        set(IDLE);
        return;
      }
      provider.pause();
      set({ ...snapshot, status: 'paused' });
    },
    resume() {
      if (snapshot.status !== 'paused') return;
      provider.resume();
      set({ ...snapshot, status: 'playing' });
    },
    stop() {
      provider.stop();
      set(IDLE);
    },
  };
}

export type PlaybackController = ReturnType<typeof createPlaybackController>;
