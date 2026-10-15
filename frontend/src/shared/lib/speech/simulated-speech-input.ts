import type { SpeechInputProvider, VoiceInputErrorCode } from './types';

export type SimulatedInputScenario = 'success' | VoiceInputErrorCode;

/**
 * Deterministic stand-in used by the design gallery and tests to show every voice-input state
 * on any browser. Always labelled "simulated" in the UI — it never touches the microphone.
 */
export function createSimulatedSpeechInput(
  scenario: SimulatedInputScenario,
  transcript: string,
  { tickMs = 60 }: { tickMs?: number } = {},
): SpeechInputProvider {
  return {
    kind: 'simulated',
    support() {
      if (scenario === 'unsupported' || scenario === 'insecure-context') {
        return { supported: false, reason: scenario };
      }
      return { supported: true };
    },
    start(_options, handlers) {
      let ended = false;
      let step = 0;
      const words = transcript.split(/\s+/).filter(Boolean);
      const finish = (result?: string) => {
        if (ended) return;
        ended = true;
        clearInterval(timer);
        if (result !== undefined) handlers.onResult(result);
        handlers.onEnd();
      };

      const timer = setInterval(() => {
        step += 1;
        if (step === 1) {
          if (scenario !== 'success') {
            handlers.onError(scenario);
            finish();
            return;
          }
          handlers.onStart();
        }
        handlers.onLevel(0.25 + 0.6 * Math.abs(Math.sin(step / 2.3)));
        const shown = Math.min(words.length, Math.floor(step / 3));
        if (shown > 0) handlers.onInterim(words.slice(0, shown).join(' '));
      }, tickMs);

      return {
        stop: () => finish(transcript),
        cancel: () => finish(),
      };
    },
  };
}
