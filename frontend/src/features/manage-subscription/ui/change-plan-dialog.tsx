'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getPlan, planChangeKind, type BillingInterval, type PlanId } from '@/entities/subscription';
import { Button, DemoBadge, Dialog, DialogClose, DialogContent, toast } from '@/shared/ui';
import { useSubscriptionActions } from '../model/use-subscription-actions';

/**
 * Confirmation for a plan change. Clearly a DEMO: no payment is taken, no card is requested,
 * and the change only updates the simulated subscription.
 */
export function ChangePlanDialog({
  open,
  onOpenChange,
  currentPlan,
  targetPlan,
  interval,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanId | null;
  targetPlan: PlanId | null;
  interval: BillingInterval;
}) {
  const t = useTranslations('subscription');
  const { changePlan, pending } = useSubscriptionActions();
  if (!targetPlan) return null;
  const kind = planChangeKind(currentPlan, targetPlan);
  const credits = getPlan(targetPlan).entitlements.monthlyCredits;
  const name = t(`plans.${targetPlan}.name`);

  const confirm = async () => {
    try {
      await changePlan(targetPlan, interval);
      toast.success(t('change.successToast', { plan: name }), { description: t('change.successDemo') });
      onOpenChange(false);
    } catch {
      toast.error(t('change.failed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={t(`change.title.${kind === 'start' ? 'upgrade' : kind}`, { plan: name })}
        description={t('change.description', { credits, interval: t(`interval.${interval}`) })}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">{t('change.cancel')}</Button>
            </DialogClose>
            <Button variant={kind === 'downgrade' ? 'secondary' : 'gradient'} loading={pending === 'change'} onClick={confirm}>
              {t('change.confirm')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <DemoBadge label={t('demoBadge')} />
          <p className="type-body text-fg-secondary flex items-start gap-2">
            <ShieldCheck className="text-success-fg mt-0.5 size-4 shrink-0" aria-hidden />
            {t('change.noPayment')}
          </p>
          {kind === 'downgrade' && <p className="type-body-sm text-warning-fg font-medium">{t('change.downgradeNote')}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
