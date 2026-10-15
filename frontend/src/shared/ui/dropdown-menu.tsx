'use client';

import { Check } from 'lucide-react';
import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib';

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-dropdown border-border bg-surface-elevated animate-pop-in min-w-44 rounded-md border p-1 shadow-lg',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

type ItemProps = ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean };

export function DropdownMenuItem({ className, destructive, ...props }: ItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'data-[highlighted]:bg-surface-muted flex cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2 text-[0.9375rem] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
        destructive ? 'text-error-fg data-[highlighted]:bg-error-tint' : 'text-fg',
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

/** Single-choice item (language, theme) with a check on the selected option. */
export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        'text-fg data-[highlighted]:bg-surface-muted relative flex cursor-pointer items-center gap-2.5 rounded-sm py-2 ps-9 pe-3 text-[0.9375rem] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      <span className="text-primary absolute start-3 inline-flex">
        <MenuPrimitive.ItemIndicator>
          <Check aria-hidden />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('bg-border -mx-1 my-1 h-px', className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn('type-caption text-fg-muted px-3 py-1.5', className)} {...props} />;
}
