'use client';

import { CalendarClock, CreditCard, RotateCcw, Sparkles } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  CreditMeter,
  creditLevel,
  effectivePlanId,
  LimitNotice,
  useSubscriptionSnapshot,
  type CreditTransaction,
} from '@/entities/subscription';
import { useSubscriptionActions } from '@/features/manage-subscription';
import { cn } from '@/shared/lib';
import { Badge, Button, DataTable, DemoBadge, Dialog, DialogClose, DialogContent, toast, type DataColumn } from '@/shared/ui';

/**
 * Settings → Subscription & credits (P-012). Shows the simulated subscription honestly:
 * plan, status, billing interval, renewal/end date, usage, history, and change/cancel/resume.
 */
export function SubscriptionSettings({ onChangePlan, className }: { onChangePlan: () => void; className?: string }) {
  const t = useTranslations('subscription');
  const format = useFormatter();
  const { subscription, balance, history } = useSubscriptionSnapshot();
  const { cancel, resume, pending } = useSubscriptionActions();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const plan = effectivePlanId(subscription);
  const date = (iso: string | null) => (iso ? format.dateTime(new Date(iso), { dateStyle: 'long', numberingSystem: 'latn' }) : '—');
  const level = creditLevel(balance);

  const columns: DataColumn<CreditTransaction>[] = [
    { key: 'kind', header: t('history.action'), cell: (r) => t(`history.kinds.${r.kind}`), primary: true },
    { key: 'at', header: t('history.date'), cell: (r) => format.dateTime(new Date(r.at), { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' }) },
    {
      key: 'delta',
      header: t('history.change'),
      align: 'end',
      numeric: true,
      cell: (r) => (
        <span className={cn('font-bold', r.delta > 0 ? 'text-success-fg' : r.delta < 0 ? 'text-fg' : 'text-fg-muted')} dir="ltr">
          {r.delta > 0 ? `+${r.delta}` : r.delta === 0 ? t('history.free') : r.delta}
        </span>
      ),
    },
    { key: 'balance', header: t('history.balance'), align: 'end', numeric: true, cell: (r) => r.balanceAfter },
  ];

  const statusTone = subscription?.status === 'active' ? 'success' : subscription?.status === 'cancel_scheduled' ? 'warning' : 'neutral';

  return (
    <section aria-labelledby="sub-settings-title" className={cn('@container flex flex-col gap-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sub-settings-title" className="type-h2">
          {t('settings.title')}
        </h2>
        <DemoBadge label={t('demoBadge')} />
      </div>

      <div className="grid gap-4 @3xl:grid-cols-[1.2fr_1fr]">
        {/* Plan card */}
        <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5">
          {subscription ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="type-caption text-fg-muted">{t('settings.currentPlan')}</p>
                  <p className="type-h3 flex items-center gap-2">
                    {plan !== 'free' && <Sparkles className="text-accent-pink size-5" aria-hidden />}
                    {t(`plans.${plan ?? 'free'}.name`)}
                  </p>
                </div>
                <Badge tone={statusTone}>{t(`status.${subscription.status}`)}</Badge>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm @md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-fg-muted size-4" aria-hidden />
                  <dt className="text-fg-muted">{t('settings.interval')}</dt>
                  <dd className="text-fg font-bold">{t(`interval.${subscription.interval}`)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="text-fg-muted size-4" aria-hidden />
                  <dt className="text-fg-muted">{subscription.status === 'cancel_scheduled' ? t('settings.endsOn') : t('settings.renewsOn')}</dt>
                  <dd className="text-fg font-bold">{date(subscription.status === 'cancel_scheduled' ? subscription.endsAt : subscription.renewsAt)}</dd>
                </div>
              </dl>
              {subscription.status === 'cancel_scheduled' && (
                <p className="type-body-sm text-warning-fg bg-warning-tint rounded-md px-3 py-2 font-medium">{t('settings.cancelScheduledNote', { date: date(subscription.endsAt) })}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2">
                <Button onClick={onChangePlan}>{t('settings.changePlan')}</Button>
                {subscription.status === 'cancel_scheduled' ? (
                  <Button
                    variant="secondary"
                    loading={pending === 'resume'}
                    onClick={async () => {
                      await resume();
                      toast.success(t('settings.resumedToast'), { description: t('change.successDemo') });
                    }}
                  >
                    <RotateCcw aria-hidden />
                    {t('settings.resume')}
                  </Button>
                ) : (
                  plan !== 'free' && (
                    <Button variant="ghost" className="text-error-fg hover:bg-error-tint" onClick={() => setConfirmCancel(true)}>
                      {t('settings.cancel')}
                    </Button>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="type-h3">{t('settings.guestTitle')}</p>
              <p className="type-body text-fg-secondary">{t('settings.guestBody')}</p>
              <Button variant="gradient" className="self-start" onClick={() => toast(t('settings.signInToast'))}>
                {t('settings.signIn')}
              </Button>
            </div>
          )}
        </div>

        {/* Usage */}
        <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5">
          <CreditMeter balance={balance} />
          {level !== 'ok' && (
            <LimitNotice
              kind={level === 'empty' ? 'out_of_credits' : 'low_credits'}
              action={
                subscription ? (
                  <Button size="sm" variant="gradient" onClick={onChangePlan}>
                    {t('limits.upgradeCta')}
                  </Button>
                ) : undefined
              }
            />
          )}
          <p className="type-caption text-fg-muted">{t('settings.freeActionsNote')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="type-h3">{t('history.title')}</h3>
        <DataTable
          columns={columns}
          rows={history.slice(0, 8)}
          getRowId={(r) => r.id}
          caption={t('history.caption')}
          emptyTitle={t('history.emptyTitle')}
          emptyDescription={t('history.emptyDescription')}
        />
      </div>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent
          closeOnOutsideClick={false}
          title={t('settings.cancelTitle')}
          description={t('settings.cancelDescription', { date: date(subscription?.renewsAt ?? null) })}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">{t('settings.keepPlan')}</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={pending === 'cancel'}
                onClick={async () => {
                  await cancel();
                  setConfirmCancel(false);
                  toast(t('settings.canceledToast'), { description: t('change.successDemo') });
                }}
              >
                {t('settings.confirmCancel')}
              </Button>
            </>
          }
        >
          <p className="type-body text-fg-secondary">{t('settings.cancelBody')}</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
