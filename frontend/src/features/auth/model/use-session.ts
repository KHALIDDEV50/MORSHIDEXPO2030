'use client';

import { useSubscriptionSnapshot } from '@/entities/subscription';
import { useCurrentUser, type UserProfile } from '@/entities/user';

/** Demo session: signed in when there is a (simulated) subscription; guest otherwise. */
export function useSession(): { signedIn: boolean; user: UserProfile | null } {
  const { subscription } = useSubscriptionSnapshot();
  const user = useCurrentUser();
  return subscription ? { signedIn: true, user } : { signedIn: false, user: null };
}
