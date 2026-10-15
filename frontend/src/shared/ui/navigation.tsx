'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Fragment, type ReactNode } from 'react';
import { cn } from '@/shared/lib';

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumbs. Separators are chevrons that point in the reading direction (flipped in RTL).
 * `renderLink` lets callers use the locale-aware Link without coupling shared/ui to routing.
 */
export function Breadcrumbs({
  items,
  renderLink,
  className,
}: {
  items: Crumb[];
  renderLink: (crumb: Crumb & { href: string }, children: ReactNode) => ReactNode;
  className?: string;
}) {
  const t = useTranslations('ui');
  return (
    <nav aria-label={t('breadcrumbs')} className={className}>
      <ol className="text-fg-secondary flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {isLast || !crumb.href ? (
                  <span aria-current={isLast ? 'page' : undefined} className={cn(isLast && 'text-fg font-medium')}>
                    {crumb.label}
                  </span>
                ) : (
                  renderLink(
                    { ...crumb, href: crumb.href },
                    <span className="hover:text-fg underline-offset-4 hover:underline">{crumb.label}</span>,
                  )
                )}
              </li>
              {!isLast && (
                <li aria-hidden>
                  <ChevronRight className="flip-rtl text-fg-muted size-4" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - (sorted[i - 1] as number) > 1 ? ['gap' as const, p] : [p]));
}

const pageButton =
  'focus-ring grid h-9 min-w-9 cursor-pointer place-items-center rounded-full px-2 text-sm font-medium tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40';

/** Pagination. "Previous/next" arrows point in the reading direction. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const t = useTranslations('ui.pagination');
  const format = useFormatter();
  if (totalPages <= 1) return null;

  const nav = (label: string, target: number, icon: ReactNode, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onPageChange(target)}
      className={cn(pageButton, 'text-fg-secondary hover:bg-surface-muted [&_svg]:size-4')}
    >
      {icon}
    </button>
  );

  return (
    <nav aria-label={t('label')} className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      {nav(t('first'), 1, <ChevronsLeft className="flip-rtl" aria-hidden />, page === 1)}
      {nav(t('previous'), page - 1, <ChevronLeft className="flip-rtl" aria-hidden />, page === 1)}
      {pageWindow(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="text-fg-muted px-1" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={t('page', { page: p })}
            className={cn(
              pageButton,
              p === page ? 'bg-primary text-primary-fg' : 'text-fg hover:bg-surface-muted',
            )}
          >
            {format.number(p)}
          </button>
        ),
      )}
      {nav(t('next'), page + 1, <ChevronRight className="flip-rtl" aria-hidden />, page === totalPages)}
      {nav(t('last'), totalPages, <ChevronsRight className="flip-rtl" aria-hidden />, page === totalPages)}
    </nav>
  );
}
