import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { SitePalette } from './site-palette';

/**
 * Layout for the public website (/, /features, /destinations, /how-it-works, /guides, /blog,
 * /mobile-app, /privacy, /terms). Separate from the product's AppShell on purpose: different
 * navigation and warm public tokens (`site-public`, P-021/P-022) in light and dark, on the same
 * theme system, components and data as the product.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const t = useTranslations('site');
  return (
    <div className="site-public bg-page text-fg flex min-h-dvh flex-col">
      <SitePalette />
      <a href="#main-content" className="focus-ring bg-surface text-fg sr-only fixed start-3 top-3 z-50 rounded-full px-4 py-2 text-sm font-bold shadow-lg focus:not-sr-only">
        {t('skipToContent')}
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
