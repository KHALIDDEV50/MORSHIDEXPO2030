'use client';

import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { EmptyState } from './feedback';

/* ───────────── Primitives (semantic <table>, logical alignment for RTL/LTR) ───────────── */

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table className={cn('w-full border-separate border-spacing-0 text-[0.9375rem]', className)} {...props} />;
}

export function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return <caption className={cn('type-body-sm text-fg-secondary pb-3 text-start font-normal', className)} {...props} />;
}

export function TableHeader({ className, sticky = false, ...props }: ComponentProps<'thead'> & { sticky?: boolean }) {
  return <thead className={cn(sticky && '[&_th]:bg-surface/95 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:backdrop-blur-sm', className)} {...props} />;
}

export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody {...props} />;
}

export function TableRow({ className, selected, ...props }: ComponentProps<'tr'> & { selected?: boolean }) {
  return (
    <tr
      // aria-selected is only valid in grids; in a plain table the chosen row is "current"
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'group/row transition-colors duration-150 [&>*]:border-border [&>*]:border-b last:[&>*]:border-b-0',
        'hover:[&>*]:bg-surface-muted/70',
        selected && '[&>*]:bg-selection hover:[&>*]:bg-selection [&>*:first-child]:shadow-[inset_3px_0_0_var(--primary)] rtl:[&>*:first-child]:shadow-[inset_-3px_0_0_var(--primary)]',
        className,
      )}
      {...props}
    />
  );
}

/* The deprecated HTML `align` attribute is replaced by logical alignment (start/end/center). */
export function TableHead({ className, align = 'start', ...props }: Omit<ComponentProps<'th'>, 'align'> & { align?: 'start' | 'end' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-border text-fg-muted h-10 border-b px-4 text-xs font-bold whitespace-nowrap',
        align === 'start' && 'text-start',
        align === 'end' && 'text-end',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, align = 'start', numeric = false, ...props }: Omit<ComponentProps<'td'>, 'align'> & { align?: 'start' | 'end' | 'center'; numeric?: boolean }) {
  return (
    <td
      className={cn(
        'text-fg h-14 px-4 align-middle',
        align === 'start' && 'text-start',
        align === 'end' && 'text-end',
        align === 'center' && 'text-center',
        numeric && 'tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

/* ───────────── DataTable: columns → table on wide containers, stacked cards on narrow ───────────── */

export type DataColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'start' | 'end' | 'center';
  numeric?: boolean;
  /** Fixed/min width, e.g. '12rem' */
  width?: string;
  /** Truncate long text to one line (full text is exposed via the `title` returned by `titleOf`) */
  truncate?: boolean;
  /** Plain text for the native tooltip when truncated */
  titleOf?: (row: T) => string;
  /** Shown as the card title in stacked mode */
  primary?: boolean;
  /** Hide this column in stacked mode (e.g. row actions duplicated elsewhere) */
  hideWhenStacked?: boolean;
};

type DataTableProps<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Accessible name / visible caption */
  caption: string;
  showCaption?: boolean;
  selectedId?: string | null;
  /** Makes rows selectable with mouse and keyboard (Enter/Space) */
  onRowSelect?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /**
   * stack: below the container breakpoint rows become cards (best for few columns) ·
   * scroll: keep the table and scroll horizontally (best for comparison grids)
   */
  narrow?: 'stack' | 'scroll';
  stickyHeader?: boolean;
  className?: string;
};

/**
 * Accessible data table with restrained styling: header hierarchy, comfortable 56px rows,
 * hairline separators, hover/selected/focus states, skeleton loading and an empty state.
 * Container-responsive (`@container`): it adapts to the space it gets, not the window.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  showCaption = false,
  selectedId = null,
  onRowSelect,
  loading = false,
  loadingRows = 4,
  emptyTitle,
  emptyDescription,
  emptyAction,
  narrow = 'stack',
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  const selectable = Boolean(onRowSelect);
  const onKey = (e: KeyboardEvent, row: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowSelect?.(row);
    }
  };

  const cellContent = (col: DataColumn<T>, row: T) =>
    col.truncate ? (
      <span className="block max-w-full truncate" title={col.titleOf?.(row)}>
        {col.cell(row)}
      </span>
    ) : (
      col.cell(row)
    );

  if (!loading && rows.length === 0) {
    return (
      <div className={cn('border-border bg-surface rounded-lg border', className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  const primary = columns.find((c) => c.primary) ?? columns[0];
  const stack = narrow === 'stack';

  return (
    <div className={cn('@container', className)}>
      {/* Table view */}
      <div
        className={cn(
          'border-border bg-surface overflow-x-auto rounded-lg border',
          stack && 'hidden @2xl:block',
        )}
      >
        <Table aria-busy={loading || undefined}>
          <TableCaption className={cn(!showCaption && 'sr-only', 'px-4 pt-3')}>{caption}</TableCaption>
          <TableHeader sticky={stickyHeader}>
            <tr>
              {columns.map((col) => (
                <TableHead key={col.key} align={col.align} style={col.width ? { width: col.width, minWidth: col.width } : undefined}>
                  {col.header}
                </TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: loadingRows }, (_, i) => (
                  <TableRow key={`s-${i}`}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <span className="bg-surface-muted block h-3.5 animate-pulse rounded-sm motion-reduce:animate-none" style={{ width: `${55 + ((i * 17 + col.key.length * 7) % 35)}%` }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selectedId === id;
                  return (
                    <TableRow
                      key={id}
                      selected={selectable ? isSelected : undefined}
                      tabIndex={selectable ? 0 : undefined}
                      onClick={selectable ? () => onRowSelect?.(row) : undefined}
                      onKeyDown={selectable ? (e) => onKey(e, row) : undefined}
                      className={cn(selectable && 'focus-visible:[&>*]:bg-selection cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus)]')}
                    >
                      {columns.map((col) =>
                        col.primary ? (
                          <th key={col.key} scope="row" className={cn('text-fg h-14 px-4 text-start font-bold', col.align === 'end' && 'text-end')}>
                            {cellContent(col, row)}
                          </th>
                        ) : (
                          <TableCell key={col.key} align={col.align} numeric={col.numeric} className={cn(col.truncate && 'max-w-0')}>
                            {cellContent(col, row)}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Stacked cards (narrow containers) — same data, label/value pairs */}
      {stack && (
        <ul className="flex flex-col gap-2.5 @2xl:hidden" aria-label={caption} aria-busy={loading || undefined}>
          {loading
            ? Array.from({ length: loadingRows }, (_, i) => (
                <li key={`s-${i}`} className="border-border bg-surface flex flex-col gap-2 rounded-lg border p-4">
                  <span className="bg-surface-muted h-4 w-1/2 animate-pulse rounded-sm motion-reduce:animate-none" />
                  <span className="bg-surface-muted h-3 w-3/4 animate-pulse rounded-sm motion-reduce:animate-none" />
                </li>
              ))
            : rows.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedId === id;
                const body = (
                  <>
                    <span className="text-fg block text-[0.9375rem] font-bold">{primary ? primary.cell(row) : null}</span>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                      {columns
                        .filter((c) => c !== primary && !c.hideWhenStacked)
                        .map((col) => (
                          <div key={col.key} className="flex min-w-0 flex-col">
                            <dt className="type-caption text-fg-muted">{col.header}</dt>
                            <dd className={cn('text-fg min-w-0 text-sm', col.numeric && 'tabular-nums')}>{col.cell(row)}</dd>
                          </div>
                        ))}
                    </dl>
                  </>
                );
                return (
                  <li key={id}>
                    {selectable ? (
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onRowSelect?.(row)}
                        className={cn(
                          'focus-ring border-border bg-surface w-full cursor-pointer rounded-lg border p-4 text-start transition-colors',
                          isSelected ? 'border-primary/50 bg-selection' : 'hover:bg-surface-muted/60',
                        )}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="border-border bg-surface rounded-lg border p-4">{body}</div>
                    )}
                  </li>
                );
              })}
        </ul>
      )}
    </div>
  );
}
