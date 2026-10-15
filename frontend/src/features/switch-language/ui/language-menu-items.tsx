'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { LOCALES, SUPPORTED_LOCALES, type Locale } from '@/shared/config';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownSubmenu } from '@/shared/ui';
import { useLanguageSwitch } from '../model/use-language-switch';

type SubmenuControl = { open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Language submenu for an existing dropdown (account menu). Choosing a language applies it
 * immediately (same page and query, architecture.md §5) and closes the submenu.
 */
export function LanguageSubmenu(props: SubmenuControl) {
  return (
    <Suspense fallback={<LanguageSubmenuFallback {...props} />}>
      <LanguageSubmenuInner {...props} />
    </Suspense>
  );
}

function LanguageSubmenuFallback({ open, onOpenChange }: SubmenuControl) {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  return (
    <DropdownSubmenu open={open} onOpenChange={onOpenChange} icon={<Languages />} label={t('label')} value={LOCALES[locale].label}>
      {() => null}
    </DropdownSubmenu>
  );
}

function LanguageSubmenuInner({ open, onOpenChange }: SubmenuControl) {
  const t = useTranslations('language');
  const { locale, switchTo } = useLanguageSwitch();
  return (
    <DropdownSubmenu open={open} onOpenChange={onOpenChange} icon={<Languages />} label={t('label')} value={LOCALES[locale].label}>
      {({ select }) => (
        <DropdownMenuRadioGroup value={locale} onValueChange={(v) => switchTo(v as Locale)}>
          {SUPPORTED_LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code} dir={LOCALES[code].dir} onSelect={select}>
              {LOCALES[code].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      )}
    </DropdownSubmenu>
  );
}
