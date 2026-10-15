'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Desktop sidebar preference (single source of truth for rail width + content offset).
 * - null ("auto"): CSS decides — collapsed on 768–1279px, expanded on ≥1280px.
 * - 'expanded' / 'collapsed': the user's explicit choice, remembered on this device.
 * The value is exposed as `data-sidebar` on the shell, so first paint is pure CSS (no layout jump).
 */
export type SidebarPreference = 'expanded' | 'collapsed' | null;

const KEY = 'morshid:sidebar';
const listeners = new Set<() => void>();

function read(): SidebarPreference {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === 'expanded' || value === 'collapsed' ? value : null;
  } catch {
    return null; // storage blocked (private mode, policies) → auto
  }
}

let memory: SidebarPreference | undefined;

function getSnapshot(): SidebarPreference {
  if (memory === undefined) memory = read();
  return memory;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memory = read();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSidebarPreference() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const setPreference = useCallback((next: SidebarPreference) => {
    memory = next;
    try {
      if (next) window.localStorage.setItem(KEY, next);
      else window.localStorage.removeItem(KEY);
    } catch {
      // Not persisted, but still applied for this session
    }
    listeners.forEach((l) => l());
  }, []);
  return { preference, setPreference };
}
