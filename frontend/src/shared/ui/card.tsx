import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib';

type CardProps = ComponentProps<'div'> & {
  /** flat: border only · raised: soft shadow · floating: glass over maps */
  elevation?: 'flat' | 'raised' | 'floating';
  /**
   * Clickable card: subtle lift on hover, press feedback, focus ring when its inner link/button
   * (see `CardLink`) is focused. Keep a single primary target per card.
   */
  interactive?: boolean;
  /** Chosen state (e.g. selected plan or character) — ring + tint, announced via the inner control */
  selected?: boolean;
  /** Visually and functionally unavailable */
  disabled?: boolean;
  /** Content is loading — dims content and sets aria-busy (pair with skeletons) */
  loading?: boolean;
};

/**
 * Card surface (design-system.md §14). Radius 16 · hairline border · surface background.
 * Hover/pressed only when `interactive`; selection uses a primary ring, never a heavy shadow.
 */
export function Card({
  className,
  elevation = 'flat',
  interactive = false,
  selected = false,
  disabled = false,
  loading = false,
  ...props
}: CardProps) {
  return (
    <div
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        'border-border bg-surface text-fg relative isolate flex flex-col overflow-hidden rounded-lg border',
        elevation === 'raised' && 'shadow-md',
        elevation === 'floating' && 'glass rounded-xl shadow-lg',
        interactive &&
          'hover:border-border-strong focus-within:ring-focus/35 transition-[box-shadow,border-color,transform] duration-200 ease-standard focus-within:ring-3 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.995] motion-reduce:hover:translate-y-0',
        selected && 'border-primary/60 bg-surface-brand ring-primary/40 ring-2',
        disabled && 'pointer-events-none opacity-55 saturate-50',
        loading && '[&>*:not([data-card-skeleton])]:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Media slot with a fixed aspect ratio so images never stretch and grids stay aligned.
 * Put an <Image fill> or `ImagePlaceholder` inside.
 */
export function CardMedia({
  ratio = 'landscape',
  className,
  children,
  overlay,
}: {
  ratio?: 'wide' | 'landscape' | 'square' | 'portrait';
  className?: string;
  children: ReactNode;
  /** Badges/actions layered on the media (top corners) */
  overlay?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'bg-surface-muted relative shrink-0 overflow-hidden [&>*:first-child]:size-full [&>img]:object-cover',
        ratio === 'wide' && 'aspect-[16/9]',
        ratio === 'landscape' && 'aspect-[4/3]',
        ratio === 'square' && 'aspect-square',
        ratio === 'portrait' && 'aspect-[3/4]',
        className,
      )}
    >
      {children}
      {overlay && <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2 [&>*]:pointer-events-auto">{overlay}</div>}
    </div>
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-0', className)} {...props} />;
}

/** Overline above the title (category / context) */
export function CardEyebrow({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('type-caption text-fg-muted font-medium tracking-normal', className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 className={cn('type-h4 text-fg leading-snug', className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('type-body-sm text-fg-secondary font-normal', className)} {...props} />;
}

/** Row of small icon + text facts (area, duration, stops). */
export function CardMeta({ items, className }: { items: { icon?: ReactNode; label: ReactNode; key?: string }[]; className?: string }) {
  return (
    <ul className={cn('text-fg-secondary flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem]', className)}>
      {items.map((item, i) => (
        <li key={item.key ?? i} className="inline-flex items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:opacity-80">
          {item.icon}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-auto flex flex-wrap items-center gap-2 px-5 pb-5', className)} {...props} />;
}

/**
 * Makes the whole card clickable through one real link/button (accessible "stretched link").
 * Other buttons inside the card must use `relative z-10` to stay independently clickable.
 */
export function CardLink({ className, children, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn('cursor-pointer text-start outline-none after:absolute after:inset-0 after:z-0 after:content-[""]', className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Loading placeholder that matches a media card's layout. */
export function CardSkeleton({ ratio = 'landscape', lines = 2, className }: { ratio?: 'wide' | 'landscape' | 'square'; lines?: number; className?: string }) {
  return (
    <div data-card-skeleton aria-hidden className={cn('border-border bg-surface flex flex-col overflow-hidden rounded-lg border', className)}>
      <div
        className={cn(
          'bg-surface-muted animate-shimmer bg-[linear-gradient(90deg,transparent_25%,rgb(255_255_255/0.5)_50%,transparent_75%)] bg-[length:200%_100%] dark:bg-[linear-gradient(90deg,transparent_25%,rgb(255_255_255/0.05)_50%,transparent_75%)]',
          ratio === 'wide' ? 'aspect-[16/9]' : ratio === 'square' ? 'aspect-square' : 'aspect-[4/3]',
        )}
      />
      <div className="flex flex-col gap-2 p-4">
        <span className="bg-surface-muted h-4 w-2/3 rounded-sm" />
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="bg-surface-muted h-3 rounded-sm" style={{ width: `${85 - i * 20}%` }} />
        ))}
      </div>
    </div>
  );
}
