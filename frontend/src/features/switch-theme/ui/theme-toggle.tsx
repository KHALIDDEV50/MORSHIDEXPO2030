'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { cn } from '@/shared/lib';

const subscribe = () => () => {};

/**
 * One-tap light ↔ dark switch (sun / moon) for compact headers. It sets the SAME next-themes
 * preference as the product's Light / Dark / System control (D-007), so the choice is saved
 * and shared across the public site and the platform. The accessible name says what it does.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('theme');
  const { resolvedTheme, setTheme } = useTheme();
  // The resolved theme is only known on the client: render a neutral, stable button first.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? t('toLight') : t('toDark')}
      title={dark ? t('toLight') : t('toDark')}
      className={cn('focus-ring text-fg hover:bg-surface-muted relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full transition-colors', className)}
    >
      <Sun aria-hidden className={cn('absolute size-[1.15rem] transition-[opacity,rotate,scale] duration-300', dark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0')} />
      <Moon aria-hidden className={cn('absolute size-[1.1rem] transition-[opacity,rotate,scale] duration-300', dark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
    </button>
  );
}
