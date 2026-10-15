'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib';
import { inputBase } from './input';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = Omit<ComponentProps<typeof SelectPrimitive.Root>, 'children'> & {
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
};

/** Accessible single-select built on Radix. Direction follows the app DirectionProvider. */
export function Select({
  options,
  placeholder,
  id,
  className,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'aria-label': ariaLabel,
  ...rootProps
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...rootProps}>
      <SelectPrimitive.Trigger
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        className={cn(
          inputBase,
          'flex h-11 cursor-pointer items-center justify-between gap-2 px-3.5 text-start data-[placeholder]:text-fg-muted',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="text-fg-muted size-4" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-dropdown border-border bg-surface-elevated max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border p-1 shadow-lg data-[state=open]:animate-pop-in"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="text-fg data-[highlighted]:bg-surface-muted relative flex cursor-pointer items-center rounded-sm py-2 ps-8 pe-3 text-[0.9375rem] outline-none select-none data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemIndicator className="text-primary absolute start-2 inline-flex">
                  <Check className="size-4" aria-hidden />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
