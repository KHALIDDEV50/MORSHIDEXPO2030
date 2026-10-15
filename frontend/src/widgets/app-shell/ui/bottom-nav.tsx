'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { isActive, isGuidedMode, NAV_ITEMS } from '../model/nav-items';
import { NavIcon } from './nav-icon';

/**
 * Bottom navigation for <768px (D-014): five destinations with icons and visible labels,
 * Chat first at the inline-start (rightmost in Arabic). 64px + safe area; ≥48px touch targets.
 * Hidden in guided Start Plan mode (D-015).
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  if (isGuidedMode(pathname)) return null;

  return (
    <nav
      aria-label={t('mainLabel')}
      className="z-nav bg-nav/95 border-border fixed inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {NAV_ITEMS.map((nav) => {
          const active = isActive(pathname, nav.href);
          return (
            <li key={nav.key} className="flex">
              <Link
                href={nav.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[0.6875rem] transition-colors',
                  active ? 'text-primary font-bold' : 'text-fg-muted font-medium hover:text-fg',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-14 place-items-center rounded-full transition-colors duration-200',
                    active ? 'bg-primary-tint' : 'bg-transparent',
                  )}
                >
                  <span className={cn(active && '[&_svg]:text-accent-pink')}>
                    <NavIcon name={nav.key} className={active ? 'text-primary' : undefined} />
                  </span>
                </span>
                <span className="max-w-full truncate px-0.5">{t(nav.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
