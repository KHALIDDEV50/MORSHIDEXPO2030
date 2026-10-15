import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SpeechServicesProvider, createSimulatedSpeechOutput } from '@/shared/lib/speech';
import { messages, renderWithIntl } from '@/test/render';
import { detectSpeechLang } from '../model/detect-lang';
import { SpeakButton } from './speak-button';

const ar = messages.ar.voice.output;

function setup(scenario: 'success' | 'unsupported' | 'no-voice' = 'success') {
  renderWithIntl(
    <SpeechServicesProvider output={createSimulatedSpeechOutput(scenario, { msPerChar: 1000 })}>
      <SpeakButton messageId="m1" text="أهلًا بك في الرياض" character="arif" characterName="عارف" />
      <SpeakButton messageId="m2" text="Welcome to Riyadh" character="roaya" characterName="رؤية" />
    </SpeechServicesProvider>,
  );
  return userEvent.setup();
}

describe('SpeakButton', () => {
  it('plays, pauses, resumes and stops, labelling the voice as a demo', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'استمع إلى رد عارف' }));
    expect(screen.getByRole('group', { name: ar.controlsLabel })).toBeInTheDocument();
    expect(screen.getByText(ar.demoVoice)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ar.pause }));
    expect(screen.getByRole('button', { name: ar.resume })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ar.resume }));
    expect(screen.getByRole('button', { name: ar.pause })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ar.stop }));
    expect(screen.getByRole('button', { name: 'استمع إلى رد عارف' })).toBeInTheDocument();
  });

  it('never lets two messages speak at once', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'استمع إلى رد عارف' }));
    await user.click(screen.getByRole('button', { name: 'استمع إلى رد رؤية' }));
    // The first message is back to "Listen"; only one set of playback controls exists
    expect(screen.getByRole('button', { name: 'استمع إلى رد عارف' })).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: ar.controlsLabel })).toHaveLength(1);
  });

  it('shows an explained fallback when read-aloud is unsupported', async () => {
    const user = setup('unsupported');
    const [fallback] = screen.getAllByRole('button', { name: ar.unavailableLabel });
    await user.click(fallback!);
    expect(await screen.findByText(ar.errors.unsupported.title)).toBeInTheDocument();
  });

  it('explains when the device has no voice for the language', () => {
    setup('no-voice');
    expect(screen.getAllByRole('button', { name: ar.unavailableLabel })).toHaveLength(2);
  });
});

describe('detectSpeechLang', () => {
  it('speaks each reply in its own language', () => {
    expect(detectSpeechLang('أهلًا بك في الرياض')).toBe('ar-SA');
    expect(detectSpeechLang('Welcome to Riyadh')).toBe('en-US');
    // Mixed text follows the majority script
    expect(detectSpeechLang('زر قصر المصمك (Masmak) صباحًا')).toBe('ar-SA');
    expect(detectSpeechLang('Visit Masmak Fortress — قصر المصمك — at nine')).toBe('en-US');
  });
});
