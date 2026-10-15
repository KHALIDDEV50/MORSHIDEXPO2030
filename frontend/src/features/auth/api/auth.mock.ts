import { subscriptionStore } from '@/entities/subscription';
import { DEMO_USER, userRepository } from '@/entities/user';
import { ApiError, demoCall } from '@/shared/api';
import { DEMO_ACCOUNT } from '../model/auth-schemas';

/**
 * DEMO AuthRepository (api-contracts.md §3) — NOT production security: nothing leaves the
 * browser, any well-formed email with an 8+ character password signs in (PRD §4.7). Signing in
 * turns the guest into the demo account on the free plan; signing out returns to guest mode.
 */
function signIn(user: { name?: string; email: string }) {
  const local = user.email.split('@')[0] ?? 'traveler';
  const isDemo = user.email.toLowerCase() === DEMO_ACCOUNT.email;
  const name = user.name?.trim() || (isDemo ? null : local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
  userRepository.setUser(isDemo && !user.name ? DEMO_USER : { ...DEMO_USER, email: user.email.toLowerCase(), name: { ar: name ?? DEMO_USER.name.ar, en: name ?? DEMO_USER.name.en } });
  if (subscriptionStore.getSnapshot().subscription === null) subscriptionStore.loadDemoProfile('plus');
}

export const authRepository = {
  login: ({ email, password }: { email: string; password: string }) =>
    demoCall('auth', () => {
      if (password.length < 8) throw new ApiError('UNAUTHORIZED', 'Invalid email or password');
      signIn({ email });
    }),
  signup: ({ name, email }: { name: string; email: string; password: string }) => demoCall('auth', () => signIn({ name, email })),
  logout: () => demoCall('auth', () => subscriptionStore.loadDemoProfile('guest')),
  /** "Try the demo": opens the sample demo profile without typing any credentials. */
  startDemo: () => demoCall('auth', () => signIn({ email: DEMO_ACCOUNT.email })),
  /** "Continue as a guest": no profile at all (the same state as after signing out). */
  continueAsGuest: () => demoCall('auth', () => subscriptionStore.loadDemoProfile('guest')),
  /** Demo: no email is sent — the UI says so. */
  requestPasswordReset: () => demoCall('auth', () => undefined),
  resetPassword: () => demoCall('auth', () => undefined),
};
