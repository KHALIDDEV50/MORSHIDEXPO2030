'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { SegmentedControl } from '@/shared/ui';

type ThemeChoice = 'light' | 'dark' | 'system';

const subscribe = () => () => {};

/** Light / dark / system switch (D-007). Persisted by next-themes. */
export function ThemeSwitcher({ iconOnly = true }: { iconOnly?: boolean }) {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client; render a neutral value on the server.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const value = (mounted ? theme : 'system') as ThemeChoice;

  return (
    <SegmentedControl<ThemeChoice>
      label={t('label')}
      value={value}
      onValueChange={setTheme}
      iconOnly={iconOnly}
      options={[
        { value: 'light', label: t('light'), icon: <Sun aria-hidden /> },
        { value: 'dark', label: t('dark'), icon: <Moon aria-hidden /> },
        { value: 'system', label: t('system'), icon: <Monitor aria-hidden /> },
      ]}
    />
  );
}
