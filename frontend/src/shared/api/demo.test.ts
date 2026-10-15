import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createDemoStore, demoCall, maybeFail, resetAllDemoStores } from './demo';
import { ApiError, toApiError } from './errors';
import { inBounds, localize, paginate } from './types';

const Schema = z.object({ count: z.number() });

describe('createDemoStore', () => {
  beforeEach(() => window.localStorage.clear());

  it('starts from the seed and persists changes under morshid:v1:<key>', () => {
    const store = createDemoStore('test-a', Schema, () => ({ count: 1 }));
    expect(store.get()).toEqual({ count: 1 });
    store.update((s) => ({ count: s.count + 1 }));
    expect(JSON.parse(window.localStorage.getItem('morshid:v1:test-a')!)).toEqual({ count: 2 });
  });

  it('loads saved state, and falls back to the seed when the saved state is invalid', () => {
    window.localStorage.setItem('morshid:v1:test-b', JSON.stringify({ count: 5 }));
    expect(createDemoStore('test-b', Schema, () => ({ count: 0 })).get()).toEqual({ count: 5 });

    window.localStorage.setItem('morshid:v1:test-c', JSON.stringify({ count: 'bad' }));
    expect(createDemoStore('test-c', Schema, () => ({ count: 0 })).get()).toEqual({ count: 0 });

    window.localStorage.setItem('morshid:v1:test-d', '{not json');
    expect(createDemoStore('test-d', Schema, () => ({ count: 0 })).get()).toEqual({ count: 0 });
  });

  it('notifies subscribers and resets every registered store', () => {
    const store = createDemoStore('test-e', Schema, () => ({ count: 0 }));
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({ count: 9 });
    expect(listener).toHaveBeenCalledTimes(1);

    resetAllDemoStores();
    expect(store.get()).toEqual({ count: 0 });
    expect(window.localStorage.getItem('morshid:v1:test-e')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('demo calls', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('resolves after simulated latency', async () => {
    const promise = demoCall('x', () => 42);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(42);
  });

  it('can be aborted', async () => {
    const controller = new AbortController();
    const promise = demoCall('x', () => 42, controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ code: 'ABORTED' });
  });

  it('injects failures with ?demoError=<domain|all>', () => {
    window.history.replaceState(null, '', '/?demoError=plans');
    expect(() => maybeFail('plans')).toThrow(ApiError);
    expect(() => maybeFail('places')).not.toThrow();
    window.history.replaceState(null, '', '/?demoError=all');
    expect(() => maybeFail('places')).toThrow(ApiError);
  });
});

describe('errors and helpers', () => {
  it('normalizes thrown values into ApiError codes', () => {
    expect(toApiError(new TypeError('fetch failed')).code).toBe('NETWORK');
    expect(toApiError(new DOMException('x', 'AbortError')).code).toBe('ABORTED');
    expect(toApiError(Schema.safeParse({}).error).code).toBe('VALIDATION');
    expect(toApiError('weird').code).toBe('UNKNOWN');
    const original = new ApiError('NOT_FOUND');
    expect(toApiError(original)).toBe(original);
  });

  it('paginates, localizes with fallback and checks bounds', () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({ items: [3, 4], page: 2, pageSize: 2, total: 5 });
    expect(localize({ ar: 'مرحبا', en: 'Hello' }, 'fr')).toBe('Hello');
    expect(localize({ ar: 'مرحبا', en: 'Hello' }, 'ar')).toBe('مرحبا');
    const riyadh = { north: 25, south: 24.5, east: 47, west: 46.5 };
    expect(inBounds({ lat: 24.63, lng: 46.71 }, riyadh)).toBe(true);
    expect(inBounds({ lat: 21.48, lng: 39.18 }, riyadh)).toBe(false);
  });
});
