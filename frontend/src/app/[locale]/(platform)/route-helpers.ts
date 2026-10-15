import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/shared/i18n';

export type LocaleParams = { params: Promise<{ locale: string }> };
type NavTitleKey = 'chat' | 'discover' | 'expo' | 'plans' | 'profile';

/** Validates the locale segment and enables static rendering for it. */
export async function resolveLocale(params: LocaleParams['params']) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}

/** `<title>` from the navigation label (e.g. "Discover · Morshid"). */
export async function navMetadata(params: LocaleParams['params'], key: NavTitleKey): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t(key) };
}

/** The design-system preview link is only useful where the dev pages are enabled. */
export const DEV_PAGES_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_PAGES === 'true';
