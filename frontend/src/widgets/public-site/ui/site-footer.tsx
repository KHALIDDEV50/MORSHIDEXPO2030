'use client';

import { Coffee } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/features/switch-language';
import { ThemeSwitcher } from '@/features/switch-theme';
import { Link } from '@/shared/i18n';
import { FOOTER_COLUMNS } from '../model/nav';
import { SaduBand } from './site-blocks';

/**
 * Public website footer on the sand surface (a deliberate, single change of ground that closes
 * every page, in both themes), opened by the Sadu band. Brand, every public page, the way into
 * the platform, the legal drafts, language and theme. No social links: none exist yet.
 */
export function SiteFooter() {
  const t = useTranslations('site');
  return (
    <footer className="bg-sand text-fg">
      <SaduBand />
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="focus-ring flex w-fit items-center gap-2 rounded-lg" aria-label={t('brandHome')}>
            <Image src="/images/brand/logo.svg" alt="" width={48} height={38} />
          </Link>
          <p className="text-fg-secondary max-w-sm text-[0.9375rem] leading-relaxed">{t('footer.about')}</p>
          <p className="text-primary inline-flex max-w-sm items-start gap-2 text-sm font-bold">
            <Coffee className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('footer.welcome')}
          </p>
          <p className="type-caption text-fg-muted max-w-sm">{t('footer.demo')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
        <nav aria-label={t('footer.label')} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">
              <h2 className="eyebrow text-accent-pink">{t(`footer.columns.${col.key}`)}</h2>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className="focus-ring text-fg-secondary hover:text-fg rounded-sm text-sm transition-colors">
                      {t(`footer.links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-border-strong/60 border-t">
        <div className="text-fg-muted mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>{t('footer.independent')}</p>
          <p>{t('footer.credits')}</p>
        </div>
      </div>
    </footer>
  );
}
