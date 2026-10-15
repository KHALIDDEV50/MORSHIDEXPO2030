import type { z } from 'zod';
import { ApiError } from './errors';

/*
 * Helpers for DEMO repositories only (NEXT_PUBLIC_DATA_SOURCE=mock). Nothing here talks to a server.
 */

/** Realistic, abortable latency (150–600 ms) so loading states are exercised. */
export function simulateLatency(signal?: AbortSignal, range: [number, number] = [150, 600]): Promise<void> {
  const [min, max] = range;
  const ms = min + Math.round(Math.random() * (max - min));
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('ABORTED'));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new ApiError('ABORTED'));
      },
      { once: true },
    );
  });
}

/**
 * Error injection for reviewing error states: add `?demoError=plans` (comma-separated domains,
 * or `all`) to any URL. Only affects demo repositories.
 */
export function maybeFail(domain: string): void {
  if (typeof window === 'undefined') return;
  const raw = new URLSearchParams(window.location.search).get('demoError');
  if (!raw) return;
  const domains = raw.split(',').map((d) => d.trim());
  if (domains.includes('all') || domains.includes(domain)) {
    throw new ApiError('NETWORK', `Simulated ${domain} failure (?demoError)`);
  }
}

/** Runs a demo operation with latency + optional injected failure. */
export async function demoCall<T>(domain: string, fn: () => T | Promise<T>, signal?: AbortSignal): Promise<T> {
  await simulateLatency(signal);
  maybeFail(domain);
  return fn();
}

const STORAGE_PREFIX = 'morshid:v1:';

/** Every persistent demo store registers here so one dev action can reset them all. */
const registry = new Map<string, { reset(): void }>();

/** Dev-only "Reset demo data": clears all `morshid:v1:*` entries and restores every seed. */
export function resetAllDemoStores(): void {
  registry.forEach((store) => store.reset());
}

/**
 * Persistent demo store: user changes are saved to localStorage under `morshid:v1:<key>`,
 * validated with the domain schema on load, and fall back to the seed when missing or invalid
 * (docs/demo-data.md §4). Works without storage (private mode) as an in-memory store.
 */
export function createDemoStore<S extends z.ZodType>(
  key: string,
  schema: S,
  seed: () => z.infer<S>,
  /** Keys of older shapes of this store (demo-data.md §4 "bump on shape change"); removed on load */
  options: { replaces?: string[] } = {},
) {
  type T = z.infer<S>;
  let state: T | undefined;
  const listeners = new Set<() => void>();

  const load = (): T => {
    if (typeof window === 'undefined') return seed();
    try {
      for (const old of options.replaces ?? []) window.localStorage.removeItem(STORAGE_PREFIX + old);
      const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) {
        const parsed = schema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data;
      }
    } catch {
      // ignore corrupt or unavailable storage → seed
    }
    return seed();
  };

  const persist = (value: T) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // storage full/blocked: keep in memory for this session
    }
  };

  const store = {
    get(): T {
      if (state === undefined) state = load();
      return state;
    },
    set(next: T) {
      state = next;
      persist(next);
      listeners.forEach((l) => l());
    },
    update(fn: (current: T) => T) {
      store.set(fn(store.get()));
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Dev "Reset demo data" */
    reset() {
      if (typeof window !== 'undefined') {
        try {
          for (const k of [key, ...(options.replaces ?? [])]) window.localStorage.removeItem(STORAGE_PREFIX + k);
        } catch {
          // ignore
        }
      }
      state = seed();
      listeners.forEach((l) => l());
    },
  };
  registry.set(key, store);
  return store;
}

/** Stable-ish unique id for demo records, e.g. `plan_k3j9x2`. */
export function demoId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
