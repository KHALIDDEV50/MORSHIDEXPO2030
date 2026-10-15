'use client';

import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { LOCALES, SUPPORTED_LOCALES, type Locale } from '@/shared/config';
import { cn } from '@/shared/lib';
import { useLanguageSwitch } from '../model/use-language-switch';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui';

/**
 * Switches language while keeping the current page and query string
 * (selected stop, filters, conversation) so no user work is lost (architecture.md §5).
 * Lists every registered locale, so it scales to 20 languages unchanged.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  // useSearchParams needs a Suspense boundary on statically rendered pages.
  return (
    <Suspense fallback={<LanguageButtonFallback className={className} />}>
      <LanguageSwitcherMenu className={className} />
    </Suspense>
  );
}

function LanguageButtonFallback({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  return (
    <Button variant="ghost" size="sm" className={cn('gap-1.5', className)} disabled>
      <Languages aria-hidden />
      <span lang={locale}>{LOCALES[locale].label}</span>
      <ChevronDown className="text-fg-muted" aria-hidden />
    </Button>
  );
}

function LanguageSwitcherMenu({ className }: { className?: string }) {
  const t = useTranslations('language');
  const { locale, switchTo, pending } = useLanguageSwitch();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1.5', className)} aria-label={t('label')} loading={pending}>
          {!pending && <Languages aria-hidden />}
          <span lang={locale}>{LOCALES[locale].label}</span>
          <ChevronDown className="text-fg-muted" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SUPPORTED_LOCALES.map((code) => (
          <DropdownMenuItem key={code} onSelect={() => switchTo(code)} lang={code} dir={LOCALES[code].dir}>
            <Check className={cn('text-primary', code !== locale && 'invisible')} aria-hidden />
            {LOCALES[code].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
