'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

export const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Never open (e.g. when the label is already visible). Markup stays identical, so no hydration change. */
  disabled?: boolean;
  className?: string;
};

/** Hover/focus hint. Not a replacement for an accessible name — icon buttons still need aria-label. */
export function Tooltip({ content, children, side = 'top', disabled = false, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={300} open={disabled ? false : undefined}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          className={cn(
            'z-tooltip bg-fg text-background animate-fade-in max-w-64 rounded-sm px-2.5 py-1.5 text-xs font-medium shadow-md',
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
