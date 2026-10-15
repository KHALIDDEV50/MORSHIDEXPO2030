import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { splitIntoChunks } from './browser-speech-output';
import { createPlaybackController } from './playback-controller';
import { createSimulatedSpeechOutput } from './simulated-speech-output';

const OPTS = { lang: 'ar-SA', character: 'arif' } as const;

describe('playback controller', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('plays one message at a time', () => {
    const c = createPlaybackController(createSimulatedSpeechOutput('success'));
    c.play('a', 'first message', OPTS);
    expect(c.getSnapshot()).toMatchObject({ activeId: 'a', status: 'playing' });
    c.play('b', 'second message', OPTS);
    expect(c.getSnapshot()).toMatchObject({ activeId: 'b', status: 'playing' });
  });

  it('pauses, resumes and stops', () => {
    const c = createPlaybackController(createSimulatedSpeechOutput('success'));
    c.play('a', 'a long enough message to keep speaking', OPTS);
    c.pause();
    expect(c.getSnapshot().status).toBe('paused');
    vi.advanceTimersByTime(60_000); // paused playback never finishes on its own
    expect(c.getSnapshot()).toMatchObject({ activeId: 'a', status: 'paused' });
    c.resume();
    expect(c.getSnapshot().status).toBe('playing');
    c.stop();
    expect(c.getSnapshot()).toMatchObject({ activeId: null, status: 'idle' });
  });

  it('returns to idle when speech ends', () => {
    const c = createPlaybackController(createSimulatedSpeechOutput('success', { msPerChar: 10 }));
    c.play('a', 'short', OPTS);
    vi.advanceTimersByTime(1000);
    expect(c.getSnapshot()).toMatchObject({ activeId: null, status: 'idle', error: null });
  });

  it('records a per-message error when read-aloud is unavailable', () => {
    const c = createPlaybackController(createSimulatedSpeechOutput('no-voice'));
    c.play('a', 'text', OPTS);
    expect(c.getSnapshot()).toMatchObject({ activeId: null, status: 'idle', error: { id: 'a', code: 'no-voice' } });
  });

  it('notifies subscribers', () => {
    const c = createPlaybackController(createSimulatedSpeechOutput('success'));
    const listener = vi.fn();
    const unsubscribe = c.subscribe(listener);
    c.play('a', 'text', OPTS);
    c.stop();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

describe('splitIntoChunks', () => {
  it('splits Arabic and English text into sentences', () => {
    expect(splitIntoChunks('أهلًا بك! ابدأ من المصمك. ثم المتحف؟ Done.')).toEqual([
      'أهلًا بك!',
      'ابدأ من المصمك.',
      'ثم المتحف؟',
      'Done.',
    ]);
  });

  it('breaks very long sentences on word boundaries', () => {
    const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ');
    const chunks = splitIntoChunks(long, 100);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
    expect(chunks.join(' ')).toBe(long);
  });
});
