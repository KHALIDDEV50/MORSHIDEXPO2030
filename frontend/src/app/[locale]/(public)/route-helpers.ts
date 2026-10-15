import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/shared/i18n';

export type LocaleParams = { params: Promise<{ locale: string }> };
export type PublicPageKey = 'home' | 'features' | 'destinations' | 'howItWorks' | 'guides' | 'journal' | 'mobileApp' | 'privacy' | 'terms';

/** Validates the locale segment and enables static rendering for it. */
export async function resolveLocale(params: LocaleParams['params']) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}

/** Title + description from `site.meta.<page>`, with the alternate-language links. */
export async function publicMetadata(params: LocaleParams['params'], key: PublicPageKey, path: string): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'site.meta' });
  return {
    title: key === 'home' ? { absolute: t('home.title') } : t(`${key}.title`),
    description: t(`${key}.description`),
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])) },
    openGraph: { title: t(`${key}.title`), description: t(`${key}.description`), locale, type: 'website' },
  };
}
