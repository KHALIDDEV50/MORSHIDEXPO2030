import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/shared/i18n';
import { MapPlayground } from '@/views/map-playground';

type Props = { params: Promise<{ locale: string }> };

/** Dev-only map review page (Phase 5). Hidden in production builds unless NEXT_PUBLIC_ENABLE_DEV_PAGES=true. */
const DEV_PAGES_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_PAGES === 'true';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'mapPlayground' });
  return { title: t('title'), robots: { index: false } };
}

export default async function MapPlaygroundPage({ params }: Props) {
  const { locale } = await params;
  if (!DEV_PAGES_ENABLED || !hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <MapPlayground />;
}
