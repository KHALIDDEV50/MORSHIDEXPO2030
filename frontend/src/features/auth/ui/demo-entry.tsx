'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Sparkles, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { displayName } from '@/entities/user';
import { useRouter } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { authRepository } from '../api/auth.mock';
import { useSession } from '../model/use-session';

/**
 * The no-credentials way in (login gateway): "Try the demo" opens the sample demo profile,
 * "Continue as a guest" uses no profile at all. Nothing is typed, nothing leaves the browser,
 * and the copy never claims an account was created.
 */
export function DemoEntry({ next }: { next: string }) {
  const t = useTranslations('auth.gateway');
  const locale = useLocale();
  const router = useRouter();
  const { signedIn, user } = useSession();

  const demo = useMutation({ mutationFn: () => authRepository.startDemo(), onSuccess: () => router.push(next) });
  const guest = useMutation({ mutationFn: () => authRepository.continueAsGuest(), onSuccess: () => router.push(next) });
  const busy = demo.isPending || guest.isPending;

  return (
    <div className="flex flex-col gap-3">
      {signedIn && user ? (
        <>
          <p className="text-fg-secondary text-sm">{t('signedInAs', { name: displayName(user, locale) })}</p>
          <Button variant="gradient" size="lg" fullWidth className="group" disabled={busy} onClick={() => router.push(next)}>
            {t('continue')}
            <ArrowRight className="nudge flip-rtl" aria-hidden />
          </Button>
          <Button variant="secondary" fullWidth loading={guest.isPending} disabled={busy} onClick={() => guest.mutate()}>
            <UserRound aria-hidden />
            {t('switchToGuest')}
          </Button>
        </>
      ) : (
        <>
          <Button variant="gradient" size="lg" fullWidth className="group" loading={demo.isPending} disabled={busy} onClick={() => demo.mutate()}>
            <Sparkles aria-hidden />
            {t('tryCta')}
          </Button>
          <p className="type-caption text-fg-muted -mt-1">{t('tryNote')}</p>
          <Button variant="secondary" fullWidth loading={guest.isPending} disabled={busy} onClick={() => guest.mutate()}>
            <UserRound aria-hidden />
            {t('guestCta')}
          </Button>
          <p className="type-caption text-fg-muted -mt-1">{t('guestNote')}</p>
        </>
      )}
      {(demo.isError || guest.isError) && (
        <p role="alert" className="border-error/40 bg-error-tint text-error-fg rounded-lg border px-3 py-2 text-sm">
          {t('error')}
        </p>
      )}
    </div>
  );
}
