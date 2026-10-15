'use client';

import { ArrowRight, Menu } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, type CSSProperties } from 'react';
import { LanguageSwitcher } from '@/features/switch-language';
import { ThemeSwitcher, ThemeToggle } from '@/features/switch-theme';
import { Link, usePathname } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useScrolledPast } from '@/shared/lib/use-motion';
import { Button, Sheet, SheetContent } from '@/shared/ui';
import { isActivePath, PUBLIC_NAV } from '../model/nav';
import { SaduBand } from './site-blocks';

/**
 * Public website header — deliberately different from the product's rail/bottom navigation.
 * It sits on the same ground as the page (no seam), then gains a frosted surface and hairline
 * once the page scrolls. Below `xl` the links move into a full-height sheet with staggered
 * entries. The sun/moon toggle (and Light / Dark / System in the menu) use the app's single
 * next-themes preference (P-022), so the choice carries over to the platform.
 */
export function SiteHeader() {
  const t = useTranslations('site');
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top,0px)] transition-[background-color,border-color,box-shadow] duration-300',
        scrolled ? 'glass border-border border-b shadow-sm' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:h-[4.5rem] sm:px-6">
        <Link href="/" className="focus-ring text-fg flex shrink-0 items-center gap-2 rounded-lg" aria-label={t('brandHome')}>
          {/* Logo only (the logo already carries the name); the link keeps its accessible name */}
          <Image src="/images/brand/logo.svg" alt="" width={40} height={32} priority />
        </Link>

        <nav aria-label={t('nav.label')} className="ms-8 hidden items-center gap-0.5 xl:flex">
          {PUBLIC_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn('focus-ring relative rounded-full px-3 py-2 text-sm font-medium transition-colors', active ? 'text-fg' : 'text-fg-secondary hover:text-fg')}
              >
                {t(`nav.${item.key}`)}
                <span aria-hidden className={cn('bg-cta absolute inset-x-3 -bottom-0.5 h-0.5 origin-center rounded-full transition-transform duration-300', active ? 'scale-x-100' : 'scale-x-0')} />
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button asChild variant="gradient" size="sm" className="group hidden sm:inline-flex">
            <Link href="/login">
              {t('cta.tryDemo')}
              <ArrowRight className="nudge flip-rtl" aria-hidden />
            </Link>
          </Button>
          <Button size="icon-sm" variant="ghost" className="xl:hidden" aria-label={t('nav.menu')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu aria-hidden />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="end" title={t('nav.menu')} className="bg-page w-full sm:w-[26rem]">
          <SaduBand className="-mx-5 mb-2 !w-[calc(100%+2.5rem)]" />
          <div className="flex flex-col pb-2">
            <nav aria-label={t('nav.label')} className="flex flex-col">
              {[{ key: 'home', href: '/' } as const, ...PUBLIC_NAV].map((item, i) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    style={{ '--delay': `${60 + i * 45}ms` } as CSSProperties}
                    className={cn('motion-rise focus-ring border-border font-display flex items-center justify-between border-b py-4 text-xl font-bold', active ? 'text-primary' : 'text-fg')}
                  >
                    {t(`nav.${item.key}`)}
                    <ArrowRight className="text-fg-muted flip-rtl size-4" aria-hidden />
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild variant="gradient" size="lg" fullWidth>
                <Link href="/login" onClick={() => setOpen(false)}>
                  {t('cta.tryDemo')}
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" fullWidth>
                <Link href="/chat" onClick={() => setOpen(false)}>
                  {t('cta.openApp')}
                </Link>
              </Button>
              <div className="border-border mt-2 flex items-center justify-between gap-3 border-t pt-4">
                <span className="text-fg-secondary text-sm font-medium">{t('nav.appearance')}</span>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
