'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Bell, LockKeyhole, LogIn, LogOut, Palette, ShieldCheck, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NOTIFICATION_KINDS, useNotificationPrefs, type NotificationPrefs } from '@/entities/notification';
import { displayName, initials, userRepository, type UserProfile } from '@/entities/user';
import { authRepository, ChangePasswordSchema, useSession, type ChangePasswordValues } from '@/features/auth';
import { useNotificationActions } from '@/features/manage-notifications';
import { ResetDemoData } from '@/features/reset-demo-data';
import { LanguageSwitcher } from '@/features/switch-language';
import { ThemeSwitcher } from '@/features/switch-theme';
import { isDemoMode } from '@/shared/config';
import { Link, useRouter } from '@/shared/i18n';
import { Avatar, Button, DemoBadge, Input, Label, Skeleton, Switch, toast } from '@/shared/ui';
import { SubscriptionSettings } from '@/widgets/subscription-settings';

/** "Reset demo data" is a dev tool for demo mode only (docs/demo-data.md §4). */
const DEV_TOOLS = isDemoMode && (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_PAGES === 'true');

function Section({ id, icon, title, children, action }: { id: string; icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-border bg-surface flex scroll-mt-24 flex-col gap-5 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-primary [&_svg]:size-5" aria-hidden>
            {icon}
          </span>
          <h2 id={`${id}-title`} className="type-h3">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Profile / Settings (PRD §4.5): profile, appearance & language, notification preferences,
 * security (mock), subscription & credits (demo), sign out. Account sections need sign-in.
 */
export function SettingsPageView() {
  const t = useTranslations('settingsPage');
  const router = useRouter();
  const { signedIn, user } = useSession();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="type-h1">{t('title')}</h1>
        <p className="type-body text-fg-secondary">{t('subtitle')}</p>
      </div>

      {!signedIn && (
        <section className="border-primary/30 bg-surface-brand flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="type-h4">{t('guestTitle')}</p>
            <p className="type-body-sm text-fg-secondary font-normal">{t('guestBody')}</p>
          </div>
          <Button asChild variant="gradient">
            <Link href="/login?next=%2Fsettings">
              <LogIn className="flip-rtl" aria-hidden />
              {t('signIn')}
            </Link>
          </Button>
        </section>
      )}

      {signedIn && user && <ProfileSection user={user} />}

      <Section id="appearance" icon={<Palette />} title={t('appearance')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{t('theme')}</span>
            <span className="type-caption text-fg-muted">{t('themeHint')}</span>
          </div>
          <ThemeSwitcher iconOnly={false} />
        </div>
        <div className="border-border flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{t('language')}</span>
            <span className="type-caption text-fg-muted">{t('languageHint')}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </Section>

      {signedIn && (
        <>
          <NotificationPrefsSection />
          <SecuritySection />
          <div id="subscription" className="scroll-mt-24">
            <SubscriptionSettings onChangePlan={() => router.push('/settings/plans')} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={() =>
                void authRepository.logout().then(() => {
                  toast(t('signedOut'));
                  router.push('/chat');
                })
              }
            >
              <LogOut className="flip-rtl" aria-hidden />
              {t('signOut')}
            </Button>
          </div>
        </>
      )}

      {DEV_TOOLS && (
        <section aria-labelledby="dev-title" className="border-border flex flex-col gap-4 rounded-xl border border-dashed p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="dev-title" className="type-h4">
              {t('devTitle')}
            </h2>
            <DemoBadge label={t('devBadge')} />
          </div>
          <ResetDemoData />
        </section>
      )}
    </div>
  );
}

const ProfileSchema = z.object({
  ar: z.string().trim().min(2, 'nameShort').max(60, 'nameLong'),
  en: z.string().trim().min(2, 'nameShort').max(60, 'nameLong'),
});

function ProfileSection({ user }: { user: UserProfile }) {
  const t = useTranslations('settingsPage');
  const ta = useTranslations('auth');
  const locale = useLocale();
  const ids = { ar: useId(), en: useId(), email: useId() };
  const form = useForm<z.infer<typeof ProfileSchema>>({ resolver: zodResolver(ProfileSchema), defaultValues: user.name, mode: 'onTouched' });
  const save = useMutation({
    mutationFn: (name: UserProfile['name']) => userRepository.updateProfile({ name }),
    onSuccess: (u) => {
      form.reset(u.name);
      toast.success(t('profileSaved'));
    },
    onError: () => toast.error(t('errorToast')),
  });
  const err = (m?: string) => (m ? ta(`errors.${m}` as 'errors.nameShort') : null);

  return (
    <Section id="profile" icon={<User />} title={t('profile')}>
      <form noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar alt={displayName(user, locale)} initials={initials(displayName(user, locale))} size="lg" ring="brand" />
          <p className="type-body-sm text-fg-secondary font-normal">{t('avatarHint')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.ar}>{t('nameAr')}</Label>
            <Input id={ids.ar} dir="rtl" lang="ar" {...form.register('ar')} aria-invalid={Boolean(form.formState.errors.ar)} />
            <span role="alert" className="type-caption text-error-fg">
              {err(form.formState.errors.ar?.message)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.en}>{t('nameEn')}</Label>
            <Input id={ids.en} dir="ltr" lang="en" {...form.register('en')} aria-invalid={Boolean(form.formState.errors.en)} />
            <span role="alert" className="type-caption text-error-fg">
              {err(form.formState.errors.en?.message)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={ids.email}>{t('email')}</Label>
            <Input id={ids.email} dir="ltr" value={user.email} readOnly aria-describedby={`${ids.email}-hint`} />
            <span id={`${ids.email}-hint`} className="type-caption text-fg-muted">
              {t('emailReadOnly')}
            </span>
          </div>
        </div>
        <Button type="submit" className="w-fit" loading={save.isPending} disabled={!form.formState.isDirty}>
          {t('saveProfile')}
        </Button>
      </form>
    </Section>
  );
}

function NotificationPrefsSection() {
  const t = useTranslations('settingsPage');
  const tn = useTranslations('notifications');
  const prefs = useNotificationPrefs();
  const { setPrefs } = useNotificationActions();
  const base = useId();

  return (
    <Section id="notifications" icon={<Bell />} title={t('notifications')}>
      <p className="type-body-sm text-fg-secondary -mt-2 font-normal">{t('notificationsHint')}</p>
      {prefs.isPending || !prefs.data ? (
        <Skeleton className="h-40" />
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {NOTIFICATION_KINDS.map((kind) => {
            const id = `${base}-${kind}`;
            return (
              <li key={kind} className="flex items-center justify-between gap-4 py-3">
                <Label htmlFor={id} className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-bold">{tn(`kinds.${kind}`)}</span>
                  <span className="type-caption text-fg-muted font-normal">{t(`prefsHint.${kind}`)}</span>
                </Label>
                <Switch
                  id={id}
                  checked={prefs.data[kind]}
                  onCheckedChange={(on) => setPrefs.mutate({ ...(prefs.data as NotificationPrefs), [kind]: on })}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function SecuritySection() {
  const t = useTranslations('settingsPage');
  const ta = useTranslations('auth');
  const ids = { current: useId(), next: useId(), confirm: useId() };
  const form = useForm<ChangePasswordValues>({ resolver: zodResolver(ChangePasswordSchema), mode: 'onTouched', defaultValues: { current: '', next: '', confirm: '' } });
  const change = useMutation({
    mutationFn: (v: ChangePasswordValues) => userRepository.changePassword({ current: v.current, next: v.next }),
    onSuccess: () => {
      form.reset();
      toast.success(t('passwordChanged'), { description: t('passwordDemo') });
    },
    onError: () => toast.error(t('errorToast')),
  });
  const field = (name: keyof ChangePasswordValues, label: string, autoComplete: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={ids[name]}>{label}</Label>
      <Input id={ids[name]} type="password" dir="ltr" autoComplete={autoComplete} {...form.register(name)} aria-invalid={Boolean(form.formState.errors[name])} />
      <span role="alert" className="type-caption text-error-fg">
        {form.formState.errors[name]?.message ? ta(`errors.${form.formState.errors[name]!.message}` as 'errors.passwordShort') : null}
      </span>
    </div>
  );

  return (
    <Section id="security" icon={<ShieldCheck />} title={t('security')} action={<DemoBadge label={t('mockBadge')} />}>
      <form noValidate onSubmit={form.handleSubmit((v) => change.mutate(v))} className="grid gap-4 sm:grid-cols-3">
        {field('current', t('currentPassword'), 'current-password')}
        {field('next', t('newPassword'), 'new-password')}
        {field('confirm', t('confirmPassword'), 'new-password')}
        <Button type="submit" variant="secondary" className="w-fit" loading={change.isPending}>
          <LockKeyhole aria-hidden />
          {t('changePassword')}
        </Button>
      </form>
    </Section>
  );
}
