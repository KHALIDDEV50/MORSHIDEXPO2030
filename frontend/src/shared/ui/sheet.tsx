'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { DialogOverlay } from './dialog';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

/**
 * `side` is logical: "start" is the right edge in Arabic and the left edge in English.
 * Bottom sheets are used for mobile filters, chat history and place details.
 */
type Side = 'bottom' | 'start' | 'end' | 'responsive';

const SIDES: Record<Side, string> = {
  // Bottom sheet on phones, full-height side panel at the reading-end edge from md up.
  responsive:
    'inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-xl border-t pb-[env(safe-area-inset-bottom)] animate-sheet-up md:inset-x-auto md:inset-y-0 md:end-0 md:h-dvh md:max-h-none md:w-[min(32rem,92vw)] md:rounded-none md:border-t-0 md:border-s md:pb-0 md:animate-sheet-end',
  // Full width on phones; on wider screens it becomes a centered panel so lines stay readable.
  bottom:
    'inset-x-0 bottom-0 mx-auto max-h-[90dvh] w-full rounded-t-xl border-t pb-[env(safe-area-inset-bottom)] animate-sheet-up md:max-w-xl md:border-x',
  start: 'inset-y-0 start-0 h-dvh w-[min(22rem,88vw)] border-e animate-sheet-start',
  end: 'inset-y-0 end-0 h-dvh w-[min(26rem,92vw)] border-s animate-sheet-end',
};

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  side?: Side;
  title: ReactNode;
  description?: ReactNode;
  hideTitle?: boolean;
  footer?: ReactNode;
};

export function SheetContent({
  side = 'bottom',
  title,
  description,
  hideTitle,
  footer,
  className,
  children,
  ...props
}: SheetContentProps) {
  const t = useTranslations('ui');
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay className="z-sheet" />
      <DialogPrimitive.Content
        className={cn(
          'z-sheet border-border bg-surface-elevated fixed flex flex-col shadow-lg outline-none',
          SIDES[side],
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        {(side === 'bottom' || side === 'responsive') && (
          <div
            className={cn('bg-border-strong mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full', side === 'responsive' && 'md:hidden')}
            aria-hidden
          />
        )}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className={cn('type-h4', hideTitle && 'sr-only')}>{title}</DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="type-body-sm text-fg-secondary font-normal">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label={t('close')}
            className="focus-ring text-fg-muted hover:bg-surface-muted hover:text-fg -me-1 grid size-9 shrink-0 place-items-center rounded-full"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-border flex gap-2 border-t px-5 py-4">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
