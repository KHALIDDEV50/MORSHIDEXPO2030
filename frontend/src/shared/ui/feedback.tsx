'use client';

import { Inbox, RotateCcw, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Button } from './button';

/** Loading placeholder with a soft shimmer (static under reduced motion). */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn(
        'bg-surface-muted animate-shimmer rounded-md bg-[linear-gradient(90deg,transparent_25%,rgb(255_255_255/0.5)_50%,transparent_75%)] bg-[length:200%_100%] dark:bg-[linear-gradient(90deg,transparent_25%,rgb(255_255_255/0.05)_50%,transparent_75%)]',
        className,
      )}
      {...props}
    />
  );
}

type StateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

function StateLayout({ title, description, icon, action, className, tone }: StateProps & { tone: 'neutral' | 'error' }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div
        className={cn(
          'mb-1 grid size-16 place-items-center rounded-full [&_svg]:size-7',
          tone === 'error' ? 'bg-error-tint text-error-fg' : 'bg-surface-brand text-primary',
        )}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="type-h4">{title}</h3>
      {description && <p className="type-body text-fg-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon = <Inbox />, ...props }: StateProps) {
  return <StateLayout tone="neutral" icon={icon} {...props} />;
}

type ErrorStateProps = Partial<Pick<StateProps, 'title' | 'description' | 'className' | 'icon'>> & {
  onRetry?: () => void;
  retrying?: boolean;
  /** The failure (e.g. an ApiError) — picks a specific explanation */
  error?: unknown;
};

/** Error codes with their own explanation (duck-typed `{ code }`, e.g. an ApiError). */
const KNOWN_ERRORS = ['NETWORK', 'TIMEOUT', 'UNAUTHORIZED', 'FORBIDDEN', 'UNCONFIGURED', 'NOT_IMPLEMENTED', 'RATE_LIMITED', 'NOT_FOUND', 'SERVER'] as const;
type KnownError = (typeof KNOWN_ERRORS)[number];
function knownCode(error: unknown): KnownError | null {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : null;
  return (KNOWN_ERRORS as readonly string[]).includes(code ?? '') ? (code as KnownError) : null;
}

/**
 * Error state. Pass the query's `error` to tell apart a network failure, a timeout, a sign-in
 * problem and a service that isn't connected yet (API base URL not configured) — never shown as
 * "no results".
 */
export function ErrorState({ title, description, onRetry, retrying, icon = <TriangleAlert />, className, error }: ErrorStateProps) {
  const t = useTranslations('ui');
  const code = knownCode(error);
  return (
    <StateLayout
      tone="error"
      icon={icon}
      title={title ?? (code ? t(`errors.${code}.title`) : t('errorTitle'))}
      description={description ?? (code ? t(`errors.${code}.description`) : t('errorDescription'))}
      className={className}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry} loading={retrying}>
            {!retrying && <RotateCcw aria-hidden />}
            {t('retry')}
          </Button>
        )
      }
    />
  );
}

/** Inline spinner for small loading areas. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  const t = useTranslations('ui');
  return (
    <span role="status" className={cn('inline-flex items-center gap-2', className)}>
      <span className="border-border-strong border-t-primary size-5 animate-spin rounded-full border-2" aria-hidden />
      <span className="sr-only">{label ?? t('loading')}</span>
    </span>
  );
}
