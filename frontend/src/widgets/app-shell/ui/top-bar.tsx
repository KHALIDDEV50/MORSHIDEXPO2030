'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/features/switch-language';
import { Link, usePathname } from '@/shared/i18n';
import { activeItem } from '../model/nav-items';
import { CreditsIndicator, ExpiryWarning } from './account-status';
import { NotificationsButton } from './notifications-button';
import { UserMenu } from './user-menu';

/**
 * Top bar.
 * - Phones (approved, unchanged): logo + section title, language switch, notifications, account.
 * - Desktop/tablet (Gate D refinement): breadcrumb, credits, notifications, expiry warning (when
 *   due) and the horizontal account trigger; language & theme live in the account menu.
 */
export function TopBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const current = activeItem(pathname);
  const title = current ? t(current.key) : t('home');

  return (
    <header className="z-sticky bg-nav/85 border-border sticky top-0 border-b pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link href="/chat" className="focus-ring shrink-0 rounded-md md:hidden" aria-label={t('home')}>
            <Image src="/images/brand/logo.svg" alt="" width={34} height={28} />
          </Link>
          <nav aria-label={t('breadcrumbLabel')} className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm">
              <li className="text-fg-muted hidden md:block">{t('brand')}</li>
              <li className="text-fg-muted hidden md:block" aria-hidden>
                /
              </li>
              <li aria-current="page" className="type-h4 truncate text-base md:text-sm md:font-medium">
                {title}
              </li>
            </ol>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {/* Phones only — on desktop the language switch is in the account menu */}
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
          <CreditsIndicator className="hidden md:inline-flex" />
          <NotificationsButton />
          <ExpiryWarning className="hidden md:inline-flex" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
