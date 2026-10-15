import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterId } from '@/entities/ai-character';
import {
  SpeechServicesProvider,
  createSimulatedSpeechInput,
  createSimulatedSpeechOutput,
  type SimulatedInputScenario,
} from '@/shared/lib/speech';
import { messages, renderWithIntl } from '@/test/render';
import { VoiceCompanion } from './voice-companion';

const en = messages.en;
const HEARD = 'What should I see first in Riyadh?';

function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [character, setCharacter] = useState<CharacterId>('arif');
  return (
    <VoiceCompanion
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onClose();
      }}
      character={character}
      onCharacterChange={setCharacter}
    />
  );
}

function setup(input: SimulatedInputScenario = 'success', output: 'success' | 'unsupported' = 'success') {
  const onClose = vi.fn();
  renderWithIntl(
    <SpeechServicesProvider input={createSimulatedSpeechInput(input, HEARD, { tickMs: 40 })} output={createSimulatedSpeechOutput(output, { msPerChar: 200 })}>
      <Harness onClose={onClose} />
    </SpeechServicesProvider>,
    'en',
  );
  return { user: userEvent.setup({ delay: null }), onClose };
}

const status = () => screen.getByRole('status');

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('Voice conversation mode', () => {
  it('listens, lets the user review/edit, and sends only on explicit action', async () => {
    const { user } = setup();
    expect(screen.getByRole('dialog', { name: en.voiceMode.dialogTitle.replace('{name}', 'Arif') })).toBeInTheDocument();
    expect(status()).toHaveTextContent(en.voiceMode.status.idle.replace('{name}', 'Arif'));

    await user.click(screen.getByRole('button', { name: en.voiceMode.startListening.replace('{name}', 'Arif') }));
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(status()).toHaveTextContent(en.voiceMode.status.listening);

    await user.click(screen.getByRole('button', { name: en.voiceMode.stopListening }));
    // Review: nothing sent yet, text is editable
    expect(status()).toHaveTextContent(en.voiceMode.status.review);
    const draft = screen.getByLabelText(en.voiceMode.reviewLabel);
    expect(draft).toHaveValue(HEARD);
    await user.type(draft, ' Please');

    await user.click(screen.getByRole('button', { name: en.voiceMode.send.replace('{name}', 'Arif') }));
    expect(status()).toHaveTextContent(en.voiceMode.status.thinking.replace('{name}', 'Arif'));
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(status()).toHaveTextContent(en.voiceMode.status.speaking.replace('{name}', 'Arif'));

    // Playback controls
    await user.click(screen.getByRole('button', { name: en.voice.output.pause }));
    expect(status()).toHaveTextContent(en.voiceMode.status.paused);
    await user.click(screen.getByRole('button', { name: en.voice.output.resume }));
    expect(status()).toHaveTextContent(en.voiceMode.status.speaking.replace('{name}', 'Arif'));
    await user.click(screen.getByRole('button', { name: en.voice.output.stop }));
    expect(screen.getByRole('button', { name: en.voiceMode.replay })).toBeEnabled();

    // Transcript shows both turns, the reply labelled as demo
    await user.click(screen.getByRole('button', { name: en.voiceMode.showTranscript }));
    const transcript = screen.getByRole('region', { name: en.voiceMode.transcript });
    expect(transcript).toHaveTextContent(`${HEARD} Please`);
    expect(transcript).toHaveTextContent(en.voiceMode.demoReply);
  });

  it('muting blocks the microphone', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: en.voiceMode.mute }));
    expect(status()).toHaveTextContent(en.voiceMode.status.muted);
    expect(screen.getByRole('button', { name: en.voiceMode.startListening.replace('{name}', 'Arif') })).toBeDisabled();
  });

  it('shows a polished fallback when microphone permission is denied', async () => {
    const { user } = setup('permission-denied');
    await user.click(screen.getByRole('button', { name: en.voiceMode.startListening.replace('{name}', 'Arif') }));
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(screen.getByRole('alert')).toHaveTextContent(en.voice.input.errors['permission-denied'].title);
  });

  it('falls back to text when read-aloud is unsupported', async () => {
    const { user } = setup('success', 'unsupported');
    await user.click(screen.getByRole('button', { name: en.voiceMode.startListening.replace('{name}', 'Arif') }));
    await act(() => vi.advanceTimersByTimeAsync(600));
    await user.click(screen.getByRole('button', { name: en.voiceMode.stopListening }));
    await user.click(screen.getByRole('button', { name: en.voiceMode.send.replace('{name}', 'Arif') }));
    await act(() => vi.advanceTimersByTimeAsync(1500));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(en.voice.output.errors.unsupported.title);
    expect(alert).toHaveTextContent(en.voiceMode.demoReplies.arif.r1); // reply still readable
  });

  it('switching character starts a fresh session with the new identity', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: en.characters.switchTo.replace('{name}', 'Roaya') }));
    expect(screen.getByRole('heading', { name: 'Roaya' })).toBeInTheDocument();
    expect(status()).toHaveTextContent(en.voiceMode.status.idle.replace('{name}', 'Roaya'));
  });

  it('exits with "Back to chat"', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: en.voiceMode.exit }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
