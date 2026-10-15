'use client';

import { Tabs as TabsPrimitive, ToggleGroup } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib';

export const Tabs = TabsPrimitive.Root;

/** Underline tabs (My Plans tabs, booth details). Scrolls horizontally on small screens. */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'border-border flex gap-1 overflow-x-auto border-b [scrollbar-width:none]',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'focus-ring text-fg-secondary hover:text-fg data-[state=active]:text-primary relative -mb-px h-11 shrink-0 cursor-pointer px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-primary',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('focus-ring pt-4', className)} {...props} />;
}

export type SegmentOption<T extends string> = { value: T; label: string; icon?: ReactNode };

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentOption<T>[];
  /** Accessible name of the group, e.g. "View" */
  label: string;
  /** Show only icons (labels become accessible names) */
  iconOnly?: boolean;
  className?: string;
};

/** Pill segmented control — Chat/Map and List/Map toggles. Exactly one option is always selected. */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  iconOnly = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next as T)}
      aria-label={label}
      className={cn(
        // Never wider than its container: long labels scroll horizontally instead of overflowing the page
        'border-border bg-surface inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border p-1 shadow-sm [scrollbar-width:none]',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={iconOnly ? option.label : undefined}
          title={iconOnly ? option.label : undefined}
          className={cn(
            'focus-ring text-fg-secondary hover:text-fg data-[state=on]:bg-cta data-[state=on]:text-on-cta inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors [&_svg]:size-[1.15rem]',
            iconOnly ? 'w-9' : 'px-4',
          )}
        >
          {option.icon}
          {!iconOnly && option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
