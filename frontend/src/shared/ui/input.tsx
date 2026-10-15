import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib';

export const inputBase =
  'w-full rounded-md border border-input bg-surface text-fg placeholder:text-fg-muted transition-[border-color,box-shadow] duration-150 outline-none ' +
  'focus-visible:border-focus focus-visible:ring-3 focus-visible:ring-focus/25 ' +
  'aria-invalid:border-error aria-invalid:focus-visible:ring-error/25 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(inputBase, 'h-11 px-3.5', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea rows={rows} className={cn(inputBase, 'min-h-24 resize-y px-3.5 py-2.5', className)} {...props} />
  );
}
