export type {
  SpeechInputProvider,
  SpeechInputSession,
  SpeechInputHandlers,
  VoiceInputErrorCode,
  SpeechOutputProvider,
  SpeakOptions,
  VoiceOutputErrorCode,
} from './types';
export { browserSpeechInput } from './browser-speech-input';
export { browserSpeechOutput, splitIntoChunks, warmUpVoices } from './browser-speech-output';
export { createSimulatedSpeechInput, type SimulatedInputScenario } from './simulated-speech-input';
export { createSimulatedSpeechOutput } from './simulated-speech-output';
export {
  createPlaybackController,
  type PlaybackController,
  type PlaybackSnapshot,
  type PlaybackStatus,
} from './playback-controller';
export { SpeechServicesProvider, useSpeechServices, usePlaybackSnapshot } from './speech-context';

/** BCP-47 tag used for speech in each UI locale. */
export function speechLang(locale: string): string {
  return locale === 'ar' ? 'ar-SA' : 'en-US';
}
