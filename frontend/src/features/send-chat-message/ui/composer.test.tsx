import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpeechServicesProvider, createSimulatedSpeechInput, type SimulatedInputScenario } from '@/shared/lib/speech';
import { messages, renderWithIntl } from '@/test/render';
import { Composer } from './composer';

const ar = messages.ar;
const TRANSCRIPT = 'أريد زيارة أهم المواقع التاريخية في الرياض';

function setup(scenario: SimulatedInputScenario = 'success') {
  const onSend = vi.fn();
  const user = userEvent.setup({ delay: null });
  renderWithIntl(
    <SpeechServicesProvider input={createSimulatedSpeechInput(scenario, TRANSCRIPT, { tickMs: 50 })}>
      <Composer characterName="عارف" onSend={onSend} />
    </SpeechServicesProvider>,
  );
  const mic = () => screen.getByRole('button', { name: ar.voice.input.start });
  const textbox = () => screen.getByRole('textbox');
  const recorder = () => screen.queryByRole('group', { name: ar.voice.input.recordingGroup });
  return { onSend, user, mic, textbox, recorder };
}

// Fake timers that also follow real time, so user-event and React effects keep running.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('Composer — text', () => {
  it('sends on Enter and adds a new line on Shift+Enter', async () => {
    const { user, textbox, onSend } = setup();
    await user.type(textbox(), 'مرحبا');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(textbox()).toHaveValue('مرحبا\n');
    expect(onSend).not.toHaveBeenCalled();
    await user.type(textbox(), 'عارف{Enter}');
    expect(onSend).toHaveBeenCalledWith('مرحبا\nعارف');
    expect(textbox()).toHaveValue('');
  });
});

describe('Composer — voice input', () => {
  it('records, shows the live transcript, and inserts editable text without sending', async () => {
    const { user, mic, textbox, onSend, recorder } = setup('success');
    await user.click(mic());
    expect(recorder()).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(800));
    // Focus moved into the recorder, on the primary "Done" action
    expect(screen.getByRole('button', { name: ar.voice.input.stop })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: ar.voice.input.stop }));

    expect(recorder()).not.toBeInTheDocument();
    expect(textbox()).toHaveValue(TRANSCRIPT);
    expect(onSend).not.toHaveBeenCalled();

    // The user can edit before sending
    await user.type(textbox(), '؟{Enter}');
    expect(onSend).toHaveBeenCalledWith(`${TRANSCRIPT}؟`);
  });

  it('cancelling discards the recording and returns focus to the mic', async () => {
    const { user, mic, textbox, onSend, recorder } = setup('success');
    await user.click(mic());
    await act(() => vi.advanceTimersByTimeAsync(500));
    await user.click(screen.getByRole('button', { name: ar.voice.input.cancel }));
    await act(() => vi.advanceTimersByTimeAsync(50));

    expect(recorder()).not.toBeInTheDocument();
    expect(textbox()).toHaveValue('');
    expect(onSend).not.toHaveBeenCalled();
    expect(mic()).toHaveFocus();
  });

  it('Esc cancels a recording', async () => {
    const { user, mic, textbox, recorder } = setup('success');
    await user.click(mic());
    await act(() => vi.advanceTimersByTimeAsync(300));
    await user.keyboard('{Escape}');
    expect(recorder()).not.toBeInTheDocument();
    expect(textbox()).toHaveValue('');
  });

  it('explains a denied microphone permission and keeps typing available', async () => {
    const { user, mic, textbox } = setup('permission-denied');
    await user.click(mic());
    await act(() => vi.advanceTimersByTimeAsync(100));

    expect(screen.getByRole('alert')).toHaveTextContent(ar.voice.input.errors['permission-denied'].title);
    await user.type(textbox(), 'نص');
    expect(textbox()).toHaveValue('نص');
    await user.click(screen.getByRole('button', { name: ar.voice.input.dismiss }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a fallback instead of recording in unsupported browsers', async () => {
    const { user, mic, recorder } = setup('unsupported');
    await user.click(mic());
    expect(recorder()).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(ar.voice.input.errors.unsupported.title);
  });

  it('reports when no speech was recognized', async () => {
    const { user, mic } = setup('no-speech');
    await user.click(mic());
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(screen.getByRole('alert')).toHaveTextContent(ar.voice.input.errors['no-speech'].title);
  });
});
