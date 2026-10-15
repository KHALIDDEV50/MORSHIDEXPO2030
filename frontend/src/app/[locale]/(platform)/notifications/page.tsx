import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/shared/i18n';
import { NotificationsPageView } from '@/views/notifications-page';
import { resolveLocale, type LocaleParams } from '../route-helpers';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'notifications' });
  return { title: t('title') };
}

export default async function NotificationsPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <NotificationsPageView />;
}
