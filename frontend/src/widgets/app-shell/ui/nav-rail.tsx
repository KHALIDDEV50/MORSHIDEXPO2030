'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection, type Locale } from '@/shared/config';
import { Link, usePathname } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { Tooltip } from '@/shared/ui';
import { FEATURED_NAV_KEY, isActive, SIDEBAR_ITEMS, type NavItem } from '../model/nav-items';
import { useSidebarPreference } from '../model/sidebar';
import { NavIcon } from './nav-icon';

/** CSS-driven visibility of labels: shown when expanded explicitly, or "auto" on ≥1280px. */
const WHEN_EXPANDED = 'hidden group-data-[sidebar=expanded]/shell:inline xl:group-data-[sidebar=auto]/shell:inline';

/**
 * Navigation rail for ≥768px (D-013, Gate D refinement): on the inline-start edge, collapsible.
 * Expanded (15rem): icon + label side by side. Collapsed (5rem): icons only with tooltips.
 * Profile stays pinned at the bottom; the active item keeps its gradient square in both states.
 * Order Chat · Expo · Discover · Plans (P-025); Expo, the featured destination, keeps a tinted
 * icon square and a small accent dot even when it is not the current page.
 */
export function NavRail() {
  const t = useTranslations('nav');
  const ts = useTranslations('shell.sidebar');
  const pathname = usePathname();
  const rtl = getDirection(useLocale() as Locale) === 'rtl';
  const { preference, setPreference } = useSidebarPreference();
  const isWide = useMediaQuery('(min-width: 1280px)');
  const expanded = preference === 'expanded' || (preference === null && isWide);
  // Tooltips open toward the content: the rail is on the right in Arabic, on the left in English
  const tooltipSide = rtl ? 'left' : 'right';
  const main = SIDEBAR_ITEMS.filter((i) => i.key !== 'profile');
  const profile = SIDEBAR_ITEMS.find((i) => i.key === 'profile');

  const item = (nav: NavItem) => {
    const active = isActive(pathname, nav.href);
    const featured = nav.key === FEATURED_NAV_KEY;
    const label = t(nav.key);
    return (
      <li key={nav.key}>
        <Tooltip content={label} side={tooltipSide} disabled={expanded}>
          <Link
            href={nav.href}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            className={cn(
              'focus-ring group/item flex h-12 items-center gap-3 rounded-xl px-1.5 text-[0.9375rem] transition-colors',
              active ? 'text-fg font-bold' : 'text-fg-secondary hover:text-fg font-medium',
              active && expanded && 'bg-surface-muted',
              !active && 'hover:bg-surface-muted',
            )}
          >
            <span
              className={cn(
                'relative grid size-10 shrink-0 place-items-center rounded-xl transition-[background-color,box-shadow] duration-200',
                active ? 'bg-cta text-on-cta shadow-glow' : featured ? 'bg-primary-tint text-primary' : '',
              )}
            >
              <NavIcon name={nav.key} />
              {featured && !active && <span aria-hidden className="bg-accent-pink ring-nav absolute -end-0.5 -top-0.5 size-2.5 rounded-full ring-2" />}
            </span>
            <span className={cn('truncate whitespace-nowrap', WHEN_EXPANDED)}>{label}</span>
          </Link>
        </Tooltip>
      </li>
    );
  };

  // The panel icon points toward the edge the rail collapses into (mirrored in RTL)
  const ToggleIcon = expanded ? PanelLeftClose : PanelLeftOpen;
  const toggleLabel = expanded ? ts('collapse') : ts('expand');

  return (
    <nav
      id="app-sidebar"
      aria-label={t('mainLabel')}
      className={cn(
        'z-nav bg-nav border-border fixed inset-y-0 start-0 hidden flex-col overflow-hidden border-e px-3 pt-4 pb-3 md:flex',
        'w-20 transition-[width] duration-300 ease-standard motion-reduce:transition-none',
        'group-data-[sidebar=expanded]/shell:w-60 xl:group-data-[sidebar=auto]/shell:w-60',
      )}
    >
      <div className="mb-5 flex h-11 items-center gap-2 px-1">
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-lg" aria-label={t('home')}>
          <Image src="/images/brand/logo.svg" alt="" width={44} height={36} priority />
        </Link>
      </div>

      <ul className="flex flex-1 flex-col gap-1">{main.map(item)}</ul>

      <div className="flex flex-col gap-1">
        {profile && <ul>{item(profile)}</ul>}
        <div className="border-border mt-1 border-t pt-2">
          <Tooltip content={toggleLabel} side={tooltipSide} disabled={expanded}>
            <button
              type="button"
              onClick={() => setPreference(expanded ? 'collapsed' : 'expanded')}
              aria-expanded={expanded}
              aria-controls="app-sidebar"
              aria-label={toggleLabel}
              className="focus-ring text-fg-muted hover:bg-surface-muted hover:text-fg flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-1.5 text-sm font-medium transition-colors"
            >
              <span className="grid size-10 shrink-0 place-items-center">
                <ToggleIcon className="flip-rtl size-5" aria-hidden />
              </span>
              <span className={cn('whitespace-nowrap', WHEN_EXPANDED)}>{ts('collapse')}</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
