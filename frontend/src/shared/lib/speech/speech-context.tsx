'use client';

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { browserSpeechInput } from './browser-speech-input';
import { browserSpeechOutput } from './browser-speech-output';
import { createPlaybackController, type PlaybackController } from './playback-controller';
import type { SpeechInputProvider, SpeechOutputProvider } from './types';

type SpeechServices = { input: SpeechInputProvider; playback: PlaybackController };

let defaultServices: SpeechServices | null = null;
function getDefaultServices(): SpeechServices {
  defaultServices ??= {
    input: browserSpeechInput,
    playback: createPlaybackController(browserSpeechOutput),
  };
  return defaultServices;
}

const SpeechContext = createContext<SpeechServices | null>(null);

/**
 * Overrides the speech providers for a subtree (gallery simulations, tests, a future backend).
 * Without it, components use the free browser providers.
 */
export function SpeechServicesProvider({
  input,
  output,
  children,
}: {
  input?: SpeechInputProvider;
  output?: SpeechOutputProvider;
  children: ReactNode;
}) {
  const parent = useContext(SpeechContext) ?? getDefaultServices();
  const value = useMemo<SpeechServices>(
    () => ({
      input: input ?? parent.input,
      playback: output ? createPlaybackController(output) : parent.playback,
    }),
    [input, output, parent],
  );
  // Stop speech when a scoped controller goes away (e.g. switching gallery scenario)
  useEffect(() => () => value.playback.stop(), [value]);
  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}

export function useSpeechServices(): SpeechServices {
  return useContext(SpeechContext) ?? getDefaultServices();
}

export function usePlaybackSnapshot() {
  const { playback } = useSpeechServices();
  return useSyncExternalStore(playback.subscribe, playback.getSnapshot, playback.getServerSnapshot);
}
