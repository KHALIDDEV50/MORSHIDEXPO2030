'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CircleCheck, KeyRound, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useForm, type FieldValues, type Path } from 'react-hook-form';
import type { z } from 'zod';
import { Link } from '@/shared/i18n';
import { Button, Input, Label } from '@/shared/ui';
import { authRepository } from '../api/auth.mock';
import { DEMO_ACCOUNT, ForgotSchema, LoginSchema, ResetSchema, SignupSchema } from '../model/auth-schemas';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const SCHEMAS = { login: LoginSchema, signup: SignupSchema, forgot: ForgotSchema, reset: ResetSchema } as const;
const FIELDS: Record<AuthMode, { name: string; type: 'text' | 'email' | 'password'; autoComplete: string }[]> = {
  login: [
    { name: 'email', type: 'email', autoComplete: 'email' },
    { name: 'password', type: 'password', autoComplete: 'current-password' },
  ],
  signup: [
    { name: 'name', type: 'text', autoComplete: 'name' },
    { name: 'email', type: 'email', autoComplete: 'email' },
    { name: 'password', type: 'password', autoComplete: 'new-password' },
    { name: 'confirm', type: 'password', autoComplete: 'new-password' },
  ],
  forgot: [{ name: 'email', type: 'email', autoComplete: 'email' }],
  reset: [
    { name: 'password', type: 'password', autoComplete: 'new-password' },
    { name: 'confirm', type: 'password', autoComplete: 'new-password' },
  ],
};

/**
 * Auth forms (PRD §4.7): login, sign up, forgot and reset password — React Hook Form + Zod,
 * loading and error states, and an honest "demo, not production security" note.
 */
export function AuthForm({ mode, onSuccess, compact = false }: { mode: AuthMode; onSuccess?: () => void; compact?: boolean }) {
  const t = useTranslations('auth');
  const formId = useId();
  const [done, setDone] = useState(false);
  const form = useForm<FieldValues>({ resolver: zodResolver(SCHEMAS[mode] as z.ZodType<FieldValues, FieldValues>), mode: 'onTouched' });
  const { register, handleSubmit, formState, setValue } = form;

  const submit = useMutation({
    mutationFn: async (values: FieldValues) => {
      if (mode === 'login') return authRepository.login(values as { email: string; password: string });
      if (mode === 'signup') return authRepository.signup(values as { name: string; email: string; password: string });
      if (mode === 'forgot') return authRepository.requestPasswordReset();
      return authRepository.resetPassword();
    },
    onSuccess: () => {
      if (mode === 'forgot' || mode === 'reset') setDone(true);
      onSuccess?.();
    },
  });

  if (done) {
    return (
      <div role="status" className="border-success/40 bg-success-tint flex flex-col gap-3 rounded-xl border p-4">
        <p className="text-success-fg flex items-center gap-2 font-bold">
          <CircleCheck className="size-5" aria-hidden />
          {mode === 'forgot' ? t('forgotDoneTitle') : t('resetDoneTitle')}
        </p>
        <p className="text-fg-secondary text-sm">{mode === 'forgot' ? t('forgotDoneBody') : t('resetDoneBody')}</p>
        <Button asChild variant="secondary" className="w-fit">
          <Link href={mode === 'forgot' ? '/reset-password' : '/login'}>{mode === 'forgot' ? t('toReset') : t('toLogin')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit((v) => submit.mutate(v))} className="flex flex-col gap-4" aria-describedby={`${formId}-note`}>
      {FIELDS[mode].map((f) => {
        const id = `${formId}-${f.name}`;
        const error = formState.errors[f.name]?.message as string | undefined;
        return (
          <div key={f.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={id}>{t(`fields.${f.name}` as 'fields.email')}</Label>
              {mode === 'login' && f.name === 'password' && (
                <Link href="/forgot-password" className="focus-ring text-primary rounded-sm text-xs font-medium hover:underline">
                  {t('forgotLink')}
                </Link>
              )}
            </div>
            <Input
              id={id}
              type={f.type}
              autoComplete={f.autoComplete}
              dir={f.type === 'text' ? 'auto' : 'ltr'}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-err` : undefined}
              {...register(f.name as Path<FieldValues>)}
            />
            {error && (
              <span id={`${id}-err`} role="alert" className="type-caption text-error-fg">
                {t(`errors.${error}` as 'errors.emailRequired')}
              </span>
            )}
          </div>
        );
      })}

      {submit.isError && (
        <p role="alert" className="border-error/40 bg-error-tint text-error-fg rounded-lg border px-3 py-2 text-sm">
          {mode === 'login' ? t('errors.loginFailed') : t('errors.generic')}
        </p>
      )}

      <Button type="submit" variant="gradient" size={compact ? 'md' : 'lg'} fullWidth loading={submit.isPending}>
        {t(`submit.${mode}`)}
      </Button>

      {mode === 'login' && (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => {
            setValue('email', DEMO_ACCOUNT.email, { shouldValidate: true });
            setValue('password', DEMO_ACCOUNT.password, { shouldValidate: true });
          }}
        >
          <KeyRound aria-hidden />
          {t('useDemo')}
        </Button>
      )}

      <p id={`${formId}-note`} className="type-caption text-fg-muted flex items-start gap-1.5">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t('demoNote')}
      </p>
    </form>
  );
}
