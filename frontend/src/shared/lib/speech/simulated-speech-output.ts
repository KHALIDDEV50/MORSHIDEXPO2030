import type { SpeechOutputProvider } from './types';

/**
 * Silent, timer-based stand-in for text-to-speech, used by the gallery and tests to show
 * playback states on devices without voices. Always labelled "simulated" in the UI.
 */
export function createSimulatedSpeechOutput(
  scenario: 'success' | 'unsupported' | 'no-voice' = 'success',
  { msPerChar = 45 }: { msPerChar?: number } = {},
): SpeechOutputProvider {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let remaining = 0;
  let startedAt = 0;
  let onDone: (() => void) | undefined;

  const run = () => {
    startedAt = Date.now();
    timer = setTimeout(() => {
      timer = undefined;
      onDone?.();
    }, remaining);
  };

  return {
    kind: 'simulated',
    canPause: true,
    support() {
      return scenario === 'success' ? { supported: true } : { supported: false, reason: scenario };
    },
    speak(text, _options, handlers) {
      clearTimeout(timer);
      if (scenario !== 'success') {
        handlers.onError(scenario);
        return;
      }
      remaining = Math.max(800, text.length * msPerChar);
      onDone = handlers.onEnd;
      run();
    },
    pause() {
      if (!timer) return;
      clearTimeout(timer);
      timer = undefined;
      remaining -= Date.now() - startedAt;
    },
    resume() {
      if (timer || !onDone) return;
      run();
    },
    stop() {
      clearTimeout(timer);
      timer = undefined;
      onDone = undefined;
    },
  };
}
