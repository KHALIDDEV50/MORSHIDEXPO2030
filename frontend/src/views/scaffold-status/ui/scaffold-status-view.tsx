import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/shared/i18n';

/**
 * Temporary Phase 1 verification page (locale, direction, fonts).
 * Deliberately unstyled beyond basics — the design system arrives in Phase 2.
 */
export function ScaffoldStatusView() {
  const t = useTranslations('scaffold');
  const tc = useTranslations('common');
  const locale = useLocale();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <Image src="/images/brand/logo.svg" alt={tc('appName')} width={94} height={76} priority />
        <Link
          href="/"
          locale={otherLocale}
          aria-label={tc('languageSwitchLabel')}
          className="rounded-full border border-current/20 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {tc('languageSwitch')}
        </Link>
      </header>

      <p className="w-fit rounded-full border border-current/20 px-3 py-1 text-xs font-medium">
        {t('badge')}
      </p>

      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-base opacity-80">{t('body')}</p>

      <ul className="list-disc space-y-1 ps-6 text-sm" data-testid="scaffold-checks">
        <li>{t('checks.locale')}</li>
        <li>{t('checks.direction')}</li>
        <li>{t('checks.fonts')}</li>
      </ul>

      <p className="text-fg-secondary flex flex-wrap items-center gap-3 text-sm">
        {t('next')}
        <Link
          href="/dev/design-system"
          className="bg-cta text-on-cta focus-ring rounded-full px-5 py-2.5 text-sm font-medium shadow-glow"
        >
          {t('galleryLink')}
        </Link>
      </p>
    </main>
  );
}
