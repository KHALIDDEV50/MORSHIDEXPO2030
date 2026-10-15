'use client';

import { ArrowLeft, FlaskConical } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { AuthForm, DemoEntry, type AuthMode } from '@/features/auth';
import { SITE_MEDIA } from '@/shared/content';
import { Link, useRouter } from '@/shared/i18n';
import { Skeleton } from '@/shared/ui';
import { MediaImage, SaduBand, SitePalette } from '@/widgets/public-site';

/** Only same-app paths are allowed after sign-in (no open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next.replace(/^\/(ar|en)(?=\/|$)/, '') || '/chat' : '/chat';
}

export function AuthPageView({ mode }: { mode: AuthMode }) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 rounded-xl" />}>
      <AuthPage mode={mode} />
    </Suspense>
  );
}

/**
 * Auth screens (PRD §4.7) — the gateway into the platform. A cinematic brand panel on large
 * screens (a compact band on phones) and, on sign-in, two clearly separate ways in:
 * "Try the demo / continue as a guest" (no credentials) and the demo sign-in form.
 * No Google/Apple buttons (social login not approved). Mock auth, clearly labelled.
 */
function AuthPage({ mode }: { mode: AuthMode }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const gateway = mode === 'login';
  const media = SITE_MEDIA.turaif;

  return (
    <div className="site-public bg-page text-fg grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <SitePalette />
      {/* Brand panel on sand (desktop) / compact band (phones) — same palette as the public site */}
      <aside className="bg-sand relative flex flex-col overflow-hidden lg:min-h-dvh">
        <SaduBand />
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:px-12 lg:pt-8">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-md">
            <Image src="/images/brand/logo.svg" alt="" width={44} height={36} />
            <span className="font-display text-xl font-extrabold">{tc('appName')}</span>
          </Link>
          <Link href="/" className="focus-ring text-fg-secondary hover:text-fg inline-flex items-center gap-1.5 rounded-sm text-sm font-medium">
            <ArrowLeft className="flip-rtl size-4" aria-hidden />
            {t('gateway.backHome')}
          </Link>
        </div>
        <div className="mt-auto hidden flex-col gap-6 px-12 pb-12 lg:flex">
          <div className="relative">
            <MediaImage media={media} frame="najdi" priority sizes="40vw" className="aspect-[16/10] w-full rounded-b-[1.75rem]" imageClassName="motion-settle" />
            <div className="absolute -bottom-6 start-6 flex items-end" aria-hidden>
              <Image src="/images/characters/arif-full.png" alt="" width={200} height={260} className="motion-rise h-40 w-auto object-contain drop-shadow-xl xl:h-48" />
              <Image src="/images/characters/roaya-full.png" alt="" width={200} height={260} className="motion-rise -ms-6 h-36 w-auto object-contain drop-shadow-xl xl:h-44" />
            </div>
          </div>
          <p className="type-statement mt-6 max-w-md [text-wrap:balance]">{t('gateway.panelTitle')}</p>
          <p className="text-fg-secondary max-w-md">{t('gateway.panelBody')}</p>
        </div>
      </aside>

      <main id="main-content" className="flex items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:py-12">
        <div className="flex w-full max-w-md flex-col gap-7">
          {gateway ? (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="type-h1">{t('gateway.title')}</h1>
                <p className="type-body text-fg-secondary">{t('gateway.subtitle')}</p>
              </div>

              <section aria-labelledby="try-title" className="border-primary/25 bg-surface flex flex-col gap-4 rounded-2xl border p-5 shadow-md">
                <div className="flex flex-col gap-1">
                  <h2 id="try-title" className="type-h3">
                    {t('gateway.tryTitle')}
                  </h2>
                  <p className="type-body-sm text-fg-secondary font-normal">{t('gateway.tryBody')}</p>
                </div>
                <DemoEntry next={next} />
              </section>

              <div className="text-fg-muted flex items-center gap-3 text-xs font-bold" aria-hidden>
                <span className="bg-border h-px flex-1" />
                {t('gateway.or')}
                <span className="bg-border h-px flex-1" />
              </div>

              <section aria-labelledby="signin-title" className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 id="signin-title" className="type-h3 flex flex-wrap items-center gap-2">
                    {t('titles.login')}
                    <span className="bg-warning-tint text-warning-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[0.6875rem] font-bold">
                      <FlaskConical className="size-3" aria-hidden />
                      {t('gateway.demoBadge')}
                    </span>
                  </h2>
                  <p className="type-body-sm text-fg-secondary font-normal">{t('subtitles.login')}</p>
                </div>
                <AuthForm mode="login" onSuccess={() => router.replace(next)} />
              </section>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="type-h1">{t(`titles.${mode}`)}</h1>
                <p className="type-body text-fg-secondary">{t(`subtitles.${mode}`)}</p>
              </div>
              <AuthForm mode={mode} onSuccess={mode === 'signup' ? () => router.replace(next) : undefined} />
            </>
          )}

          <p className="type-body-sm text-fg-secondary text-center font-normal">
            {mode === 'login' ? (
              <>
                {t('noAccount')}{' '}
                <Link href={`/signup?next=${encodeURIComponent(next)}`} className="focus-ring text-primary rounded-sm font-bold hover:underline">
                  {t('toSignup')}
                </Link>
              </>
            ) : (
              <>
                {t('haveAccount')}{' '}
                <Link href={`/login?next=${encodeURIComponent(next)}`} className="focus-ring text-primary rounded-sm font-bold hover:underline">
                  {t('toLogin')}
                </Link>
              </>
            )}
          </p>
          {!gateway && (
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="focus-ring text-fg-muted self-center rounded-sm text-sm hover:underline">
              {t('gateway.preferDemo')}
            </Link>
          )}
          <p className="type-caption text-fg-muted text-center">
            <Link href="/privacy" className="focus-ring rounded-sm underline-offset-2 hover:underline">
              {t('gateway.privacy')}
            </Link>
            {' · '}
            <Link href="/terms" className="focus-ring rounded-sm underline-offset-2 hover:underline">
              {t('gateway.terms')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
