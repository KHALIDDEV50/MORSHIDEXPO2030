import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib';

export const buttonVariants = cva(
  'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,box-shadow,opacity,transform] duration-150 ease-standard select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:size-[1.15em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Solid primary action */
        primary: 'bg-primary text-primary-fg shadow-sm hover:bg-primary-hover',
        /** Signature brand CTA (send, new conversation, start plan) — use sparingly */
        gradient: 'bg-cta text-on-cta shadow-glow hover:opacity-90',
        /** Outline */
        secondary:
          'border border-border-strong bg-surface text-fg hover:border-input hover:bg-surface-muted',
        ghost: 'text-fg hover:bg-surface-muted',
        danger: 'border border-error/40 bg-surface text-error-fg hover:bg-error-tint',
        link: 'h-auto rounded-sm px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-[0.9375rem]',
        lg: 'h-12 px-7 text-base',
        icon: 'size-11 p-0',
        'icon-sm': 'size-9 p-0',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Link) with button styles */
    asChild?: boolean;
    /** Shows a spinner, sets aria-busy and blocks clicks */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export type IconButtonProps = Omit<ButtonProps, 'size' | 'children'> & {
  /** Accessible name — required because the button shows only an icon */
  label: string;
  icon: React.ReactNode;
  size?: 'icon' | 'icon-sm';
};

/** Icon-only button that always has an accessible label. */
export function IconButton({ label, icon, size = 'icon', variant = 'ghost', ...props }: IconButtonProps) {
  return (
    <Button aria-label={label} title={label} size={size} variant={variant} {...props}>
      {icon}
    </Button>
  );
}
