import { z } from 'zod';

/** Auth form validation (PRD §4.7). Messages are translation keys. */
const email = z.string().trim().min(1, 'emailRequired').email('emailInvalid');
const password = z.string().min(8, 'passwordShort').max(128, 'passwordLong');

export const LoginSchema = z.object({ email, password: z.string().min(1, 'passwordRequired') });

export const SignupSchema = z
  .object({ name: z.string().trim().min(2, 'nameShort').max(60, 'nameLong'), email, password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'passwordsDiffer' });

export const ForgotSchema = z.object({ email });

export const ResetSchema = z.object({ password, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'passwordsDiffer' });

export const ChangePasswordSchema = z
  .object({ current: z.string().min(1, 'passwordRequired'), next: password, confirm: z.string() })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'passwordsDiffer' })
  .refine((v) => v.next !== v.current, { path: ['next'], message: 'passwordSame' });

export type LoginValues = z.infer<typeof LoginSchema>;
export type SignupValues = z.infer<typeof SignupSchema>;
export type ForgotValues = z.infer<typeof ForgotSchema>;
export type ResetValues = z.infer<typeof ResetSchema>;
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;

/** The prefilled demo account (fictional). Mock auth: any valid email + 8+ characters works. */
export const DEMO_ACCOUNT = { email: 'demo@morshid.app', password: 'morshid2030' } as const;
