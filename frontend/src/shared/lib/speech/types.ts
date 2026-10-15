/**
 * Provider-independent speech contracts (architecture.md §12, proposal P-005).
 * v1 implementations use free browser APIs; a future backend can supply custom
 * Arif/Roaya voices and server-side recognition behind the same interfaces.
 */

// ───────────── Voice input (speech → text) ─────────────

export type VoiceInputErrorCode =
  | 'unsupported' // no speech recognition in this browser
  | 'insecure-context' // microphone needs https or localhost
  | 'permission-denied'
  | 'no-microphone'
  | 'no-speech'
  | 'network' // recognition service unreachable
  | 'unknown';

export type SpeechInputHandlers = {
  /** Microphone is open and listening */
  onStart: () => void;
  /** Input level 0..1, ~30 times per second, for the waveform */
  onLevel: (level: number) => void;
  /** Live (not yet final) transcript */
  onInterim: (text: string) => void;
  /** Final transcript after `stop()` — may be empty */
  onResult: (text: string) => void;
  onError: (code: VoiceInputErrorCode) => void;
  /** Always called last; the microphone is released */
  onEnd: () => void;
};

export interface SpeechInputSession {
  /** Stop listening and deliver the final transcript */
  stop(): void;
  /** Stop listening and discard everything */
  cancel(): void;
}

export interface SpeechInputProvider {
  readonly kind: 'browser' | 'simulated' | 'backend';
  /** Synchronous capability check (no permission prompt) */
  support(): { supported: true } | { supported: false; reason: VoiceInputErrorCode };
  /** Must only be called from an explicit user action (click / key press). */
  start(options: { lang: string }, handlers: SpeechInputHandlers): SpeechInputSession;
}

// ───────────── Voice output (text → speech) ─────────────

export type VoiceOutputErrorCode = 'unsupported' | 'no-voice' | 'interrupted' | 'unknown';

export type SpeakOptions = {
  lang: string;
  /** Character whose voice settings to approximate (pitch/rate) — not a custom voice in v1 */
  character: 'arif' | 'roaya';
};

export type SpeakHandlers = {
  onEnd: () => void;
  onError: (code: VoiceOutputErrorCode) => void;
};

export interface SpeechOutputProvider {
  readonly kind: 'browser' | 'simulated' | 'backend';
  support(lang: string): { supported: true } | { supported: false; reason: VoiceOutputErrorCode };
  /** Whether pause/resume is reliable on this platform (otherwise pause acts as stop) */
  readonly canPause: boolean;
  speak(text: string, options: SpeakOptions, handlers: SpeakHandlers): void;
  pause(): void;
  resume(): void;
  stop(): void;
}
