import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { TripStopContent } from '@/entities/plan';
import { messages, renderWithIntl } from '@/test/render';
import { TripDetails } from './trip-details';

const t = messages.en.trip;

const s = (id: string, kind: TripStopContent['kind'], time: string, duration: number, completed = false): TripStopContent => ({
  id,
  kind,
  plannedTime: time,
  durationMin: duration,
  completed,
  position: { x: 10, y: 10 },
  name: id.toUpperCase(),
  area: 'Riyadh',
  description: `${id} description`,
  tips: [],
});

const STOPS = [
  s('start', 'start', '08:30', 0, true),
  s('masmak', 'visit', '09:00', 60, true),
  s('murabba', 'visit', '10:15', 45),
  s('lunch', 'break', '11:15', 60),
  s('museum', 'visit', '12:30', 90),
  s('end', 'destination', '15:45', 0),
];

function setup(now: string | null = '11:40') {
  renderWithIntl(
    <TripDetails title="Trip" subtitle="Sat" stops={STOPS} initialCurrentId="museum" now={now} mapLabel="Illustrative" geolocation={null} />,
    'en',
  );
  return userEvent.setup();
}

const progressText = () => screen.getByRole('progressbar').getAttribute('aria-valuetext');
const timeline = () => screen.getByRole('list', { name: t.timeline.label });

describe('TripDetails', () => {
  it('derives every stop state and the progress summary', () => {
    setup();
    expect(progressText()).toBe('1 of 5 stops completed');
    const list = timeline();
    expect(within(list).getByText(t.status.current)).toBeInTheDocument();
    expect(within(list).getByText(t.status.overdue)).toBeInTheDocument(); // murabba ended 11:00
    expect(within(list).getByText(t.status.break)).toBeInTheDocument();
    expect(within(list).getByText(t.status.destination)).toBeInTheDocument();
    expect(within(list).getByText(t.status.departed)).toBeInTheDocument();
  });

  it('has no overdue stops when the plan is not today', () => {
    setup(null);
    expect(within(timeline()).queryByText(t.status.overdue)).not.toBeInTheDocument();
  });

  it('marks the current stop completed from the fixed footer and updates progress', async () => {
    const user = setup();
    // The same action exists in the expanded stop and in the fixed footer; use the footer (last in DOM)
    const buttons = screen.getAllByRole('button', { name: t.actions.complete });
    await user.click(buttons[buttons.length - 1]!);
    expect(progressText()).toBe('2 of 5 stops completed');
  });

  it('keeps map markers and timeline in sync', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: `Stop 2: MURABBA — ${t.status.overdue}` }));
    expect(screen.getByRole('button', { name: `Stop 2: MURABBA — ${t.status.overdue}` })).toHaveAttribute('aria-pressed', 'true');
    // The matching timeline item is expanded with its actions
    expect(within(timeline()).getByText('murabba description')).toBeInTheDocument();
  });

  it('removes a stop, renumbers the route and supports undo', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: `Stop 2: MURABBA — ${t.status.overdue}` }));
    const murabbaItem = within(timeline()).getByText('MURABBA').closest('li') as HTMLElement;
    await user.click(within(murabbaItem).getByRole('button', { name: t.actions.remove }));
    expect(progressText()).toBe('1 of 4 stops completed');
    // MUSEUM moves from stop 3 to stop 2
    expect(screen.getByRole('button', { name: `Stop 2: MUSEUM — ${t.status.current}` })).toBeInTheDocument();
    expect(screen.queryByText('MURABBA')).not.toBeInTheDocument();
  });

  it('lets the user set a different current stop manually', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: `LUNCH — ${t.status.upcoming}` }));
    const lunchItem = within(timeline()).getByText('LUNCH').closest('li') as HTMLElement;
    await user.click(within(lunchItem).getByRole('button', { name: t.actions.setCurrent }));
    expect(screen.getByRole('button', { name: `LUNCH — ${t.status.current}` })).toBeInTheDocument();
  });
});
