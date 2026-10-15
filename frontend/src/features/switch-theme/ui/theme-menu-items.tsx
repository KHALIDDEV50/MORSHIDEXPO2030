'use client';

import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownSubmenu } from '@/shared/ui';

const subscribe = () => () => {};
type ThemeChoice = 'light' | 'dark' | 'system';

/**
 * Theme submenu for an existing dropdown (account menu). Choosing a theme applies it immediately
 * (next-themes, persisted — D-007) and closes the submenu while the menu stays open.
 */
export function ThemeSubmenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const value = ((mounted ? theme : undefined) ?? 'system') as ThemeChoice;

  return (
    <DropdownSubmenu open={open} onOpenChange={onOpenChange} icon={<Palette />} label={t('label')} value={t(value)}>
      {({ select }) => (
        <DropdownMenuRadioGroup value={value} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" onSelect={select}>
            <Sun aria-hidden />
            {t('light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" onSelect={select}>
            <Moon aria-hidden />
            {t('dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" onSelect={select}>
            <Monitor aria-hidden />
            {t('system')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      )}
    </DropdownSubmenu>
  );
}
