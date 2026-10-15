'use client';

import { useRouter } from '@/shared/i18n';
import { SubscriptionPlans } from '@/widgets/subscription-plans';

/** Settings → Plans & upgrade (D-037, demo). "Back" and "Not now" return to Settings. */
export function PlansPageView() {
  const router = useRouter();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      <SubscriptionPlans onBack={() => router.push('/settings#subscription')} />
    </div>
  );
}
