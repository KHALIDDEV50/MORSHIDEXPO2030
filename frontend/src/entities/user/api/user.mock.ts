'use client';

import { useSyncExternalStore } from 'react';
import { ApiError, createDemoStore, demoCall } from '@/shared/api';
import { UserProfileSchema, type UserProfile } from '../model/types';

/**
 * DEMO account (fictional — docs/demo-data.md "Demo users"). Whether someone is signed in is
 * decided by the session (the demo subscription store: no subscription = guest); this store
 * holds the profile shown when signed in. Persisted as `morshid:v1:user`.
 */
export const DEMO_USER: UserProfile = {
  id: 'usr_demo',
  name: { ar: 'سارة أحمد', en: 'Sara Ahmed' },
  email: 'demo@morshid.app',
  avatarUrl: null,
};

export const userStore = createDemoStore('user', UserProfileSchema, () => DEMO_USER);

export function getDemoUser(): UserProfile {
  return userStore.get();
}

/** The signed-in profile (reactive). The server render uses the demo seed. */
export function useCurrentUser(): UserProfile {
  return useSyncExternalStore(userStore.subscribe, userStore.get, () => DEMO_USER);
}

/** UserRepository (api-contracts.md §3) — demo implementation. */
export const userRepository = {
  updateProfile: (patch: Partial<Pick<UserProfile, 'name'>>) =>
    demoCall('user', () => {
      const next = UserProfileSchema.parse({ ...userStore.get(), ...patch });
      userStore.set(next);
      return next;
    }),
  /** Demo: nothing is stored — the UI says so. Rejects an empty current password. */
  changePassword: ({ current }: { current: string; next: string }) =>
    demoCall('user', () => {
      if (!current) throw new ApiError('VALIDATION', 'Current password required');
    }),
  /** Used by the mock auth flow to set who signed in. */
  setUser: (user: UserProfile) => userStore.set(UserProfileSchema.parse(user)),
};
