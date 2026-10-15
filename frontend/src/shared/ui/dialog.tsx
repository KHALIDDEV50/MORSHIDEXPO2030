'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function CloseButton() {
  const t = useTranslations('ui');
  return (
    <DialogPrimitive.Close
      aria-label={t('close')}
      className="focus-ring text-fg-muted hover:bg-surface-muted hover:text-fg absolute end-3 top-3 grid size-9 place-items-center rounded-full"
    >
      <X className="size-5" aria-hidden />
    </DialogPrimitive.Close>
  );
}

export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn('z-modal bg-overlay animate-fade-in fixed inset-0 backdrop-blur-[2px]', className)}
      {...props}
    />
  );
}

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  title: ReactNode;
  description?: ReactNode;
  /** Hide the visible title (kept for screen readers) */
  hideTitle?: boolean;
  footer?: ReactNode;
  /** false for destructive confirmations: only the buttons or Esc close them */
  closeOnOutsideClick?: boolean;
};

/** Centered modal that always fits the viewport; scrolls internally when content is tall. */
export function DialogContent({
  className,
  title,
  description,
  hideTitle,
  footer,
  children,
  closeOnOutsideClick = true,
  onInteractOutside,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        onInteractOutside={(e) => {
          if (!closeOnOutsideClick) e.preventDefault();
          onInteractOutside?.(e);
        }}
        className={cn(
          'z-modal border-border bg-surface-elevated animate-pop-in fixed inset-x-4 top-1/2 mx-auto flex max-h-[calc(100dvh-2rem)] w-auto max-w-lg -translate-y-1/2 flex-col rounded-xl border shadow-lg outline-none',
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div className="flex flex-col gap-1.5 p-6 pb-0 pe-14">
          <DialogPrimitive.Title className={cn('type-h3', hideTitle && 'sr-only')}>{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="type-body text-fg-secondary">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="border-border flex flex-wrap justify-end gap-2 border-t px-6 py-4">{footer}</div>
        )}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
