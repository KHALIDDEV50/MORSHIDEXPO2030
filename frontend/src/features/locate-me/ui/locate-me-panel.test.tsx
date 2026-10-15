import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { messages, renderWithIntl } from '@/test/render';
import type { GeolocationLike } from '../model/use-current-location';
import { LocateMePanel } from './locate-me-panel';

const t = messages.en.trip.locate;

function geo(result: { coords: { latitude: number; longitude: number; accuracy: number } } | { code: 1 | 2 | 3 }): GeolocationLike {
  return {
    getCurrentPosition: vi.fn((ok: PositionCallback, err?: PositionErrorCallback | null) => {
      if ('code' in result) err?.({ code: result.code, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      else ok({ coords: result.coords, timestamp: Date.UTC(2026, 9, 11, 8, 30) } as GeolocationPosition);
    }),
  };
}

describe('LocateMePanel', () => {
  it('asks for location only after the user taps "Where am I?"', async () => {
    const g = geo({ coords: { latitude: 24.6, longitude: 46.7, accuracy: 25 } });
    renderWithIntl(<LocateMePanel geolocation={g} />, 'en');
    expect(g.getCurrentPosition).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: t.whereAmI }));
    expect(g.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(t.foundTitle);
    expect(screen.getByRole('status')).toHaveTextContent('±25 m');
  });

  it('explains a denied permission and offers manual stop selection', async () => {
    const onChoose = vi.fn();
    renderWithIntl(<LocateMePanel geolocation={geo({ code: 1 })} onChooseStopManually={onChoose} />, 'en');
    await userEvent.click(screen.getByRole('button', { name: t.whereAmI }));
    expect(screen.getByRole('alert')).toHaveTextContent(t.errors['permission-denied'].title);
    await userEvent.click(screen.getByRole('button', { name: t.chooseManually }));
    expect(onChoose).toHaveBeenCalled();
  });

  it('handles an unavailable position and lets the user retry', async () => {
    const g = geo({ code: 2 });
    renderWithIntl(<LocateMePanel geolocation={g} />, 'en');
    await userEvent.click(screen.getByRole('button', { name: t.whereAmI }));
    expect(screen.getByRole('alert')).toHaveTextContent(t.errors.unavailable.title);
    await userEvent.click(screen.getByRole('button', { name: t.tryAgain }));
    expect(g.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('shows a fallback when the browser has no geolocation', async () => {
    renderWithIntl(<LocateMePanel geolocation={null} />, 'en');
    await userEvent.click(screen.getByRole('button', { name: t.whereAmI }));
    expect(screen.getByRole('alert')).toHaveTextContent(t.errors.unsupported.title);
    expect(screen.queryByRole('button', { name: t.tryAgain })).not.toBeInTheDocument();
  });
});
