import type {
  SpeechInputHandlers,
  SpeechInputProvider,
  SpeechInputSession,
  VoiceInputErrorCode,
} from './types';

/* Minimal Web Speech API typings (not yet in TypeScript's DOM lib). */
type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; 0: RecognitionAlternative; length: number };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapRecognitionError(error: string): VoiceInputErrorCode {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission-denied';
    case 'audio-capture':
      return 'no-microphone';
    case 'no-speech':
      return 'no-speech';
    case 'network':
      return 'network';
    default:
      return 'unknown';
  }
}

function mapMediaError(error: unknown): VoiceInputErrorCode {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permission-denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-microphone';
  return 'unknown';
}

/**
 * Browser speech recognition (Web Speech API) + a microphone level meter (Web Audio).
 * Privacy: nothing starts without an explicit click. Note that some browsers (e.g. Chrome)
 * send the audio to the browser vendor's speech service to transcribe it — documented in
 * architecture.md §12. MORSHID itself never stores or uploads audio.
 */
export const browserSpeechInput: SpeechInputProvider = {
  kind: 'browser',

  support() {
    if (typeof window === 'undefined') return { supported: false, reason: 'unsupported' };
    if (!window.isSecureContext) return { supported: false, reason: 'insecure-context' };
    if (!getRecognitionCtor() || !navigator.mediaDevices?.getUserMedia) {
      return { supported: false, reason: 'unsupported' };
    }
    return { supported: true };
  },

  start({ lang }, handlers: SpeechInputHandlers): SpeechInputSession {
    const Ctor = getRecognitionCtor();
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let raf = 0;
    let recognition: Recognition | null = null;
    let finalText = '';
    let cancelled = false;
    let stopRequested = false;
    let ended = false;
    let errored = false;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      void audioCtx?.close().catch(() => undefined);
      audioCtx = null;
    };

    const finish = () => {
      if (ended) return;
      ended = true;
      cleanup();
      if (!cancelled && !errored) handlers.onResult(finalText.trim());
      handlers.onEnd();
    };

    const fail = (code: VoiceInputErrorCode) => {
      if (ended) return;
      errored = true;
      handlers.onError(code);
      recognition?.abort();
      finish();
    };

    const meter = (source: MediaStream) => {
      try {
        audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        audioCtx.createMediaStreamSource(source).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += ((v - 128) / 128) ** 2;
          handlers.onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Level meter is decorative; recognition still works without it.
      }
    };

    if (!Ctor) {
      queueMicrotask(() => fail('unsupported'));
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          if (cancelled || stopRequested) {
            s.getTracks().forEach((t) => t.stop());
            finish();
            return;
          }
          stream = s;
          recognition = new Ctor();
          recognition.lang = lang;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onstart = () => {
            handlers.onStart();
            meter(s);
          };
          recognition.onresult = (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const r = e.results[i] as RecognitionResult;
              if (r.isFinal) finalText += `${r[0].transcript} `;
              else interim += r[0].transcript;
            }
            handlers.onInterim(`${finalText}${interim}`.trim());
          };
          recognition.onerror = (e) => {
            if (e.error === 'aborted') return;
            if (e.error === 'no-speech' && finalText) return;
            fail(mapRecognitionError(e.error));
          };
          recognition.onend = finish;
          recognition.start();
        })
        .catch((err: unknown) => fail(mapMediaError(err)));
    }

    return {
      stop() {
        stopRequested = true;
        if (recognition) recognition.stop();
        else if (!stream) finish();
      },
      cancel() {
        cancelled = true;
        if (recognition) recognition.abort();
        finish();
      },
    };
  },
};
