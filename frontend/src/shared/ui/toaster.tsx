'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

/** Global toast host. Use `toast()` from 'sonner' (re-exported from shared/ui) to show messages. */
export function Toaster({ dir }: { dir: 'rtl' | 'ltr' }) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      dir={dir}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-center"
      offset={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      mobileOffset={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            '!rounded-lg !border-border !bg-surface-elevated !text-fg !shadow-lg !font-sans !text-[0.9375rem]',
          description: '!text-fg-secondary',
        },
      }}
      className="z-toast"
    />
  );
}

export { toast } from 'sonner';
