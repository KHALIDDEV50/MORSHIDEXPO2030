'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link } from '@/shared/i18n';
import { registerSignInHandler } from '@/shared/lib/auth-gate';
import { Sheet, SheetContent } from '@/shared/ui';
import { AuthForm } from './auth-form';

/**
 * Answers `requestSignIn()` (shared/lib/auth-gate): opens a sign-in sheet over the current page
 * and resolves true after a successful sign-in, so the gated action (e.g. saving a plan)
 * completes without losing context (PRD §4.7 guest flow). Mounted once in the app shell.
 */
export function SignInSheetHost() {
  const t = useTranslations('auth');
  const [open, setOpen] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  useEffect(
    () =>
      registerSignInHandler(
        () =>
          new Promise<boolean>((resolve) => {
            resolver.current?.(false); // a previous request is superseded
            resolver.current = resolve;
            setOpen(true);
          }),
      ),
    [],
  );

  const finish = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && finish(false)}>
      <SheetContent side="bottom" title={t('sheetTitle')} description={t('sheetDescription')}>
        <AuthForm mode="login" compact onSuccess={() => finish(true)} />
        <p className="type-body-sm text-fg-secondary mt-4 text-center font-normal">
          {t('noAccount')}{' '}
          <Link href="/signup" className="focus-ring text-primary rounded-sm font-bold hover:underline" onClick={() => finish(false)}>
            {t('toSignup')}
          </Link>
        </p>
      </SheetContent>
    </Sheet>
  );
}
