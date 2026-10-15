'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { CHARACTER_IDS, type CharacterId } from './characters';

/**
 * The companion the visitor is currently talking to (Arif or Roaya), shared by Chat, Discover's
 * narration bubble and "Ask {character}". Persisted per browser; Arif (heritage guide) by default.
 */
const STORAGE_KEY = 'morshid:character';
const DEFAULT: CharacterId = 'arif';
const listeners = new Set<() => void>();
let current: CharacterId | null = null;

function read(): CharacterId {
  if (current) return current;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    current = (CHARACTER_IDS as readonly string[]).includes(stored ?? '') ? (stored as CharacterId) : DEFAULT;
  } catch {
    current = DEFAULT;
  }
  return current;
}

export function setActiveCharacter(id: CharacterId) {
  current = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // storage blocked: keep it for this session
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** [active character, setter]. The server (and first client render) uses the default. */
export function useActiveCharacter(): [CharacterId, (id: CharacterId) => void] {
  const id = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return [id, useCallback((next: CharacterId) => setActiveCharacter(next), [])];
}
