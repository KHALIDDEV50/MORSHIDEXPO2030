'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, type ComponentProps } from 'react';
import { cn } from '@/shared/lib';

type SearchFieldProps = Omit<ComponentProps<'input'>, 'type' | 'onChange' | 'value' | 'size'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name when no visible label exists */
  label: string;
  size?: 'md' | 'lg';
};

/** Pill search input (Discover, history search) with a clear button. */
export function SearchField({
  value,
  onValueChange,
  label,
  size = 'md',
  className,
  ...props
}: SearchFieldProps) {
  const t = useTranslations('ui');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-full border border-input bg-surface shadow-sm transition-[border-color,box-shadow] focus-within:border-focus focus-within:ring-3 focus-within:ring-focus/25',
        size === 'lg' ? 'h-14' : 'h-11',
        className,
      )}
    >
      <Search className="text-fg-muted pointer-events-none ms-4 size-5 shrink-0" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={label}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          'text-fg placeholder:text-fg-muted h-full min-w-0 flex-1 bg-transparent px-3 outline-none [&::-webkit-search-cancel-button]:hidden',
          size === 'lg' ? 'text-base' : 'text-[0.9375rem]',
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onValueChange('');
            inputRef.current?.focus();
          }}
          aria-label={t('clearSearch')}
          className="focus-ring text-fg-muted hover:bg-surface-muted hover:text-fg me-2 grid size-8 place-items-center rounded-full"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
