'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Light / dark / system theme, persisted by next-themes (D-007) — the ONE theme system for the
 * product and the public website. Light is the default until the visitor chooses (P-022);
 * "System" stays available in every theme control. next-themes' inline script applies the saved
 * choice before paint, so there is no flash of the wrong theme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
