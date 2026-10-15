'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { subscriptionStore, type DemoProfile } from '@/entities/subscription';
import { isDemoMode } from '@/shared/config/env';

const PROFILES: DemoProfile[] = ['guest', 'free', 'free_low', 'plus', 'plus_expiring', 'premium'];

/**
 * DEMO helper for reviewing the shell: `?demoProfile=plus_expiring` (or guest, free, free_low,
 * plus, premium) loads that simulated account. Does nothing without the parameter, and nothing
 * at all when a real API is configured (NEXT_PUBLIC_DATA_SOURCE=http).
 */
export function DemoProfileFromUrl() {
  if (!isDemoMode) return null;
  return (
    <Suspense fallback={null}>
      <Loader />
    </Suspense>
  );
}

function Loader() {
  const profile = useSearchParams().get('demoProfile');
  useEffect(() => {
    if (profile && (PROFILES as string[]).includes(profile)) subscriptionStore.loadDemoProfile(profile as DemoProfile);
  }, [profile]);
  return null;
}
