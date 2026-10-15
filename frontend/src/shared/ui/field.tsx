import { Label as LabelPrimitive } from 'radix-ui';
import { useId, type ComponentProps, type ReactElement, cloneElement } from 'react';
import { cn } from '@/shared/lib';

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('type-body-sm text-fg peer-disabled:opacity-60', className)}
      {...props}
    />
  );
}

type FieldControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

type FieldProps = {
  label: string;
  /** Single control (Input, Textarea, Select trigger …); receives id + aria wiring */
  children: ReactElement<FieldControlProps>;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

/** Label + control + hint/error with correct aria wiring. */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const generatedId = useId();
  const id = children.props.id ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-error-fg ms-0.5" aria-hidden>
            *
          </span>
        )}
      </Label>
      {cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="type-caption text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="type-caption text-error-fg">
          {error}
        </p>
      )}
    </div>
  );
}
