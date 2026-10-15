import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bounds } from '@/shared/api';
import { messages, renderWithIntl } from '@/test/render';
import { MapView, type MapViewMarker } from './map-view';
import type { MapAdapter, MapEvents, MapInstance, MarkerAnchor } from './types';

/**
 * MapView against a fake adapter (jsdom has no WebGL). Verifies the contract the real MapLibre
 * adapter must honour: marker buttons, selection, bounds and the list fallback.
 */
type FakeMap = MapInstance & { emit<E extends keyof MapEvents>(event: E, payload: MapEvents[E]): void; calls: Record<string, unknown[][]> };

let supported = true;
let failMount = false;
let current: FakeMap | null = null;

function createFakeInstance(container: HTMLElement): FakeMap {
  const listeners = new Map<string, Set<(p: unknown) => void>>();
  const elements = new Map<string, HTMLElement>();
  let snapshot: ReadonlyMap<string, HTMLElement> = new Map();
  const calls: Record<string, unknown[][]> = {};
  const record = (name: string, ...args: unknown[]) => (calls[name] ??= []).push(args);
  const fake: FakeMap = {
    calls,
    emit: (event, payload) => listeners.get(event)?.forEach((l) => l(payload)),
    setMarkers(anchors: MarkerAnchor[]) {
      record('setMarkers', anchors);
      for (const a of anchors) {
        if (elements.has(a.id)) continue;
        const el = document.createElement('div');
        container.appendChild(el);
        elements.set(a.id, el);
      }
      snapshot = new Map(elements);
      fake.emit('markers', undefined);
    },
    getMarkerElements: () => snapshot,
    setOrderLine: (line) => record('setOrderLine', line),
    setSelected: (id) => record('setSelected', id),
    reveal: (id) => record('reveal', id),
    setSelectedZone: (id) => record('setSelectedZone', id),
    fitTo: (ids) => record('fitTo', ids),
    focusZone: (id) => record('focusZone', id),
    getBounds: () => ({ north: 1, south: 0, east: 1, west: 0 }),
    on(event, listener) {
      const set = listeners.get(event) ?? new Set();
      listeners.set(event, set);
      set.add(listener as (p: unknown) => void);
      return () => {
        set.delete(listener as (p: unknown) => void);
      };
    },
    setTheme: (theme) => record('setTheme', theme),
    setLocalLayer: (layer) => record('setLocalLayer', layer),
    resize: () => {},
    destroy: () => record('destroy'),
  };
  return fake;
}

const fakeAdapter: MapAdapter = {
  provider: 'maplibre',
  isSupported: () => supported,
  mount: async (container) => {
    if (failMount) throw new Error('offline');
    current = createFakeInstance(container);
    return current;
  },
};

vi.mock('./adapter', () => ({ getMapAdapter: () => fakeAdapter }));

const MARKERS: MapViewMarker[] = [
  { id: 'a', position: { lat: 24.63, lng: 46.71 }, label: 'Stop 1: Masmak Fortress — current stop', kind: 'visit', status: 'current', number: 1 },
  { id: 'b', position: { lat: 24.64, lng: 46.71 }, label: 'Stop 2: Murabba Palace — upcoming', kind: 'visit', status: 'upcoming', number: 2 },
];

beforeEach(() => {
  supported = true;
  failMount = false;
  current = null;
});
afterEach(() => vi.clearAllMocks());

describe('MapView', () => {
  it('renders markers as named, selectable buttons and syncs the selection', async () => {
    const onSelect = vi.fn();
    function Harness() {
      const [selected, setSelected] = useState<string | null>(null);
      return (
        <MapView
          mode="geo"
          label="Map of your plan"
          markers={MARKERS}
          selectedId={selected}
          onSelect={(id) => {
            onSelect(id);
            setSelected(id);
          }}
        />
      );
    }
    renderWithIntl(<Harness />, 'en');

    const marker = await screen.findByRole('button', { name: 'Stop 2: Murabba Palace — upcoming' });
    expect(screen.getByRole('region', { name: 'Map of your plan' })).toBeInTheDocument();
    await userEvent.click(marker);
    expect(onSelect).toHaveBeenCalledWith('b');
    await waitFor(() => expect(current!.calls.setSelected?.at(-1)).toEqual(['b']));
    expect(screen.getByRole('button', { name: 'Stop 2: Murabba Palace — upcoming' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('selects markers with the keyboard and reveals the focused marker', async () => {
    const onSelect = vi.fn();
    renderWithIntl(<MapView mode="geo" label="Map" markers={MARKERS} onSelect={onSelect} />, 'en');
    const first = await screen.findByRole('button', { name: /Masmak/ });
    first.focus();
    expect(current!.calls.reveal?.at(-1)).toEqual(['a']);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('fits to the markers, draws the order line and forwards bounds and background clicks', async () => {
    const onBoundsChange = vi.fn();
    const onSelect = vi.fn();
    renderWithIntl(
      <MapView mode="geo" label="Map" markers={MARKERS} orderLine={{ ids: ['a', 'b'], progressIndex: 0 }} onBoundsChange={onBoundsChange} onSelect={onSelect} />,
      'en',
    );
    await screen.findByRole('button', { name: /Masmak/ });
    expect(current!.calls.fitTo).toBeDefined();
    expect(current!.calls.setOrderLine?.at(-1)).toEqual([{ ids: ['a', 'b'], progressIndex: 0 }]);

    const bounds: Bounds = { north: 25, south: 24, east: 47, west: 46 };
    act(() => current!.emit('boundsChange', bounds));
    expect(onBoundsChange).toHaveBeenCalledWith(bounds);
    act(() => current!.emit('backgroundClick', undefined));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('shows coded markers (e.g. Expo "3.2") and forwards zone clicks and selection', async () => {
    const onZoneSelect = vi.fn();
    renderWithIntl(
      <MapView
        mode="local"
        label="Expo"
        markers={[{ id: 'booth_x', position: [500, 200], label: '3.2 · AI Experience Hall', code: '3.2', color: '#8b5cf6' }]}
        localLayer={{ extent: { width: 1000, height: 700 }, zones: [] }}
        selectedZoneId="zone_innovation"
        onZoneSelect={onZoneSelect}
      />,
      'en',
    );
    const marker = await screen.findByRole('button', { name: '3.2 · AI Experience Hall' });
    expect(marker).toHaveTextContent('3.2');
    await waitFor(() => expect(current!.calls.setSelectedZone?.at(-1)).toEqual(['zone_innovation']));
    act(() => current!.emit('zoneClick', 'zone_culture'));
    expect(onZoneSelect).toHaveBeenCalledWith('zone_culture');
  });

  it('always labels the Expo (local) map as illustrative', async () => {
    renderWithIntl(
      <MapView mode="local" label="Expo" markers={[]} localLayer={{ extent: { width: 1000, height: 700 }, zones: [] }} />,
      'en',
    );
    expect(screen.getByText(messages.en.map.illustrative)).toBeInTheDocument();
  });

  it('falls back to a selectable list when the map is not supported', async () => {
    supported = false;
    const onSelect = vi.fn();
    renderWithIntl(<MapView mode="geo" label="Map" markers={MARKERS} onSelect={onSelect} />, 'en');
    expect(screen.getByRole('status')).toHaveTextContent(messages.en.map.unsupported);
    await userEvent.click(screen.getByRole('button', { name: /Murabba/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('shows the list and a retry when the map fails to load', async () => {
    failMount = true;
    renderWithIntl(<MapView mode="geo" label="Map" markers={MARKERS} />, 'ar');
    expect(await screen.findByRole('status')).toHaveTextContent(messages.ar.map.loadError);
    failMount = false;
    await userEvent.click(screen.getByRole('button', { name: messages.ar.map.retry }));
    expect(await screen.findByRole('button', { name: /Masmak/ })).toBeInTheDocument();
  });

  it('destroys the map on unmount', async () => {
    const { unmount } = renderWithIntl(<MapView mode="geo" label="Map" markers={MARKERS} />, 'en');
    await screen.findByRole('button', { name: /Masmak/ });
    const instance = current!;
    unmount();
    expect(instance.calls.destroy).toHaveLength(1);
  });
});
