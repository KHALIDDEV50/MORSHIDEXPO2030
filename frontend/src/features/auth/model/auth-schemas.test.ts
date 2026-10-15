import { describe, expect, it } from 'vitest';
import { ChangePasswordSchema, DEMO_ACCOUNT, ForgotSchema, LoginSchema, ResetSchema, SignupSchema } from './auth-schemas';

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) => (r.success ? [] : r.error!.issues.map((i) => i.message));

describe('auth form validation (PRD §4.7)', () => {
  it('login needs a valid email and a password', () => {
    expect(messages(LoginSchema.safeParse({ email: '', password: '' }))).toEqual(expect.arrayContaining(['emailRequired', 'passwordRequired']));
    expect(messages(LoginSchema.safeParse({ email: 'not-an-email', password: 'x' }))).toContain('emailInvalid');
    expect(LoginSchema.safeParse(DEMO_ACCOUNT).success).toBe(true);
  });

  it('sign up needs a name, 8+ characters and matching passwords', () => {
    expect(messages(SignupSchema.safeParse({ name: 'A', email: 'a@b.co', password: 'short', confirm: 'short' }))).toEqual(expect.arrayContaining(['nameShort', 'passwordShort']));
    expect(messages(SignupSchema.safeParse({ name: 'Sara', email: 'a@b.co', password: 'longenough', confirm: 'different1' }))).toContain('passwordsDiffer');
    expect(SignupSchema.safeParse({ name: 'Sara', email: 'a@b.co', password: 'longenough', confirm: 'longenough' }).success).toBe(true);
  });

  it('forgot and reset password', () => {
    expect(messages(ForgotSchema.safeParse({ email: 'x' }))).toContain('emailInvalid');
    expect(messages(ResetSchema.safeParse({ password: '12345678', confirm: '1234567' }))).toContain('passwordsDiffer');
  });

  it('change password must differ from the current one', () => {
    expect(messages(ChangePasswordSchema.safeParse({ current: 'oldpassword', next: 'oldpassword', confirm: 'oldpassword' }))).toContain('passwordSame');
    expect(ChangePasswordSchema.safeParse({ current: 'oldpassword', next: 'newpassword', confirm: 'newpassword' }).success).toBe(true);
  });
});
