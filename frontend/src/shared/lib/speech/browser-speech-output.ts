import type { SpeakHandlers, SpeakOptions, SpeechOutputProvider } from './types';

/**
 * Browser text-to-speech (Web Speech API `speechSynthesis`) — a DEMO voice.
 * It uses whatever voices the device provides; it is NOT a custom Arif or Roaya voice.
 * Character "flavour" is only an approximate pitch/rate tweak (architecture.md §12).
 */

const CHARACTER_TUNING = {
  arif: { pitch: 0.95, rate: 1 },
  roaya: { pitch: 1.1, rate: 0.97 },
} as const;

/** Chrome cuts long utterances (~15s) and pauses badly on them, so speak sentence by sentence. */
export function splitIntoChunks(text: string, max = 220): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?؟\n])\s+|(?<=،)\s+(?=\S{20,})/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= max) {
      chunks.push(sentence);
      continue;
    }
    let rest = sentence;
    while (rest.length > max) {
      const cut = rest.lastIndexOf(' ', max);
      const at = cut > max / 2 ? cut : max;
      chunks.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) chunks.push(rest);
  }
  return chunks;
}

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const base = lang.toLowerCase().split('-')[0] as string;
  const candidates = s.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(base));
  // Prefer the exact regional variant, then on-device voices (work offline, nothing leaves the device).
  const exact = candidates.filter((v) => v.lang.toLowerCase() === lang.toLowerCase());
  const pool = exact.length ? exact : candidates;
  return pool.find((v) => v.localService) ?? pool[0] ?? null;
}

/** Voices load asynchronously in Chrome; call once early so `support()` is accurate. */
export function warmUpVoices(onReady?: () => void) {
  const s = synth();
  if (!s) return;
  if (s.getVoices().length) {
    onReady?.();
    return;
  }
  s.addEventListener('voiceschanged', () => onReady?.(), { once: true });
}

const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

let generation = 0;

export const browserSpeechOutput: SpeechOutputProvider = {
  kind: 'browser',
  // speechSynthesis.pause() is a no-op on Android Chrome; there, "pause" falls back to stop.
  canPause: !isAndroid,

  support(lang) {
    const s = synth();
    if (!s) return { supported: false, reason: 'unsupported' };
    // Voices may still be loading; only report "no voice" once the list is known.
    if (s.getVoices().length > 0 && !pickVoice(lang)) return { supported: false, reason: 'no-voice' };
    return { supported: true };
  },

  speak(text, { lang, character }: SpeakOptions, handlers: SpeakHandlers) {
    const s = synth();
    if (!s) {
      handlers.onError('unsupported');
      return;
    }
    s.cancel();
    const myGeneration = ++generation;
    const chunks = splitIntoChunks(text);
    const voice = pickVoice(lang);
    const tuning = CHARACTER_TUNING[character];

    const speakChunk = (index: number) => {
      if (myGeneration !== generation) return;
      if (index >= chunks.length) {
        handlers.onEnd();
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[index]);
      u.lang = voice?.lang ?? lang;
      if (voice) u.voice = voice;
      u.pitch = tuning.pitch;
      u.rate = tuning.rate;
      u.onend = () => speakChunk(index + 1);
      u.onerror = (e) => {
        if (myGeneration !== generation) return;
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        handlers.onError(e.error === 'language-unavailable' || e.error === 'voice-unavailable' ? 'no-voice' : 'unknown');
      };
      s.speak(u);
    };
    speakChunk(0);
  },

  pause() {
    synth()?.pause();
  },
  resume() {
    synth()?.resume();
  },
  stop() {
    generation += 1;
    synth()?.cancel();
  },
};
