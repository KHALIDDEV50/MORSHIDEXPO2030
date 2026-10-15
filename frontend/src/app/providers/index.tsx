import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import type { Direction } from '@/shared/config';
import { TooltipProvider, Toaster } from '@/shared/ui';
import { DirectionProvider } from './direction-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

/** Root client providers. */
export function AppProviders({ children, dir }: { children: ReactNode; dir: Direction }) {
  return (
    <NextIntlClientProvider>
      <QueryProvider>
        <ThemeProvider>
          <DirectionProvider dir={dir}>
            <TooltipProvider>
              {children}
              <Toaster dir={dir} />
            </TooltipProvider>
          </DirectionProvider>
        </ThemeProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
