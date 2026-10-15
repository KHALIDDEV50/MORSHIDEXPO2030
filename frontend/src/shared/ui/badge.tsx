import { cva, type VariantProps } from 'class-variance-authority';
import { Circle, CircleCheck, FlaskConical, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib';

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs leading-5 font-medium whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-muted text-fg-secondary',
        primary: 'border-transparent bg-primary-tint text-primary',
        pink: 'border-transparent bg-pink-tint text-accent-pink',
        success: 'border-transparent bg-success-tint text-success-fg',
        warning: 'border-transparent bg-warning-tint text-warning-fg',
        error: 'border-transparent bg-error-tint text-error-fg',
        arif: 'border-transparent bg-arif-tint text-arif-fg',
        roaya: 'border-transparent bg-roaya-tint text-roaya-fg',
        outline: 'border-border-strong bg-transparent text-fg-secondary',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export type PriorityLevel = 'high' | 'recommended' | 'optional';

const PRIORITY = {
  high: { tone: 'pink', Icon: Star },
  recommended: { tone: 'primary', Icon: CircleCheck },
  optional: { tone: 'neutral', Icon: Circle },
} as const;

/**
 * Recommendation priority (design-system.md §2). Icon + label, never color alone.
 * These are demo rankings, not real AI confidence (D-024).
 */
export function PriorityBadge({ level, className }: { level: PriorityLevel; className?: string }) {
  const t = useTranslations('ui.priority');
  const { tone, Icon } = PRIORITY[level];
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden />
      {t(level)}
    </Badge>
  );
}

/** Marks simulated data/behavior so it is never mistaken for a real service (D-024). */
export function DemoBadge({ className, label }: { className?: string; label?: string }) {
  const t = useTranslations('ui');
  return (
    <Badge tone="warning" className={className}>
      <FlaskConical aria-hidden />
      {label ?? t('demo')}
    </Badge>
  );
}
