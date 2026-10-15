'use client';

import { ArrowLeft, Check, Compass, Crown, Gem, Minus, Sparkles } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import {
  CreditMeter,
  effectivePlanId,
  PLANS,
  useSubscriptionSnapshot,
  type BillingInterval,
  type Entitlements,
  type PlanId,
  type SubscriptionPlan,
} from '@/entities/subscription';
import { ChangePlanDialog } from '@/features/manage-subscription';
import { cn } from '@/shared/lib';
import { Badge, Button, DataTable, DemoBadge, SegmentedControl, type DataColumn } from '@/shared/ui';

const PLAN_ICON: Record<PlanId, ReactNode> = { free: <Compass />, plus: <Gem />, premium: <Crown /> };

type FeatureRow = { key: 'credits' | 'proposals' | 'saved' | 'customization' | 'personalization' | 'recommendations' | 'priority' | 'discover'; values: Record<PlanId, ReactNode> };

/**
 * Subscription & upgrade page (P-012): plan cards, a comparison table, billing interval,
 * current plan + credits, and a clear way back. Prices are never invented — unset prices read
 * "to be confirmed". Every action is a labelled demo (no payment provider).
 */
export function SubscriptionPlans({ onBack, className }: { onBack?: () => void; className?: string }) {
  const t = useTranslations('subscription');
  const format = useFormatter();
  const snapshot = useSubscriptionSnapshot();
  const [interval, setBillingInterval] = useState<BillingInterval>(snapshot.subscription?.interval ?? 'monthly');
  const [target, setTarget] = useState<PlanId | null>(null);
  const current = effectivePlanId(snapshot.subscription);
  const guest = snapshot.subscription === null;

  const priceLabel = (plan: SubscriptionPlan) => {
    const price = plan.prices[interval];
    if (!price) return t('price.tbd');
    if (price.amount === 0) return t('price.free');
    return format.number(price.amount, { style: 'currency', currency: price.currency, numberingSystem: 'latn' });
  };

  const limit = (n: number | null) => (n === null ? t('values.noCap') : format.number(n, { numberingSystem: 'latn' }));
  const yes = <Check role="img" className="text-success-fg inline-block size-5" aria-label={t('values.included')} />;
  const no = <Minus role="img" className="text-fg-muted inline-block size-5" aria-label={t('values.notIncluded')} />;
  const bool = (v: boolean) => (v ? yes : no);
  const ent = (id: PlanId): Entitlements => PLANS.find((p) => p.id === id)!.entitlements;

  const rows: FeatureRow[] = [
    { key: 'credits', values: { free: limit(ent('free').monthlyCredits), plus: limit(ent('plus').monthlyCredits), premium: limit(ent('premium').monthlyCredits) } },
    { key: 'proposals', values: { free: limit(ent('free').proposalsPerMonth), plus: limit(ent('plus').proposalsPerMonth), premium: limit(ent('premium').proposalsPerMonth) } },
    { key: 'saved', values: { free: limit(ent('free').savedPlans), plus: limit(ent('plus').savedPlans), premium: limit(ent('premium').savedPlans) } },
    { key: 'customization', values: { free: t('values.basic'), plus: t('values.extended'), premium: t('values.advanced') } },
    { key: 'personalization', values: { free: bool(ent('free').personalization), plus: bool(ent('plus').personalization), premium: bool(ent('premium').personalization) } },
    { key: 'recommendations', values: { free: bool(ent('free').enhancedRecommendations), plus: bool(ent('plus').enhancedRecommendations), premium: bool(ent('premium').enhancedRecommendations) } },
    { key: 'discover', values: { free: yes, plus: yes, premium: yes } },
    {
      key: 'priority',
      values: {
        free: no,
        plus: no,
        premium: <Badge tone="outline">{t('values.future')}</Badge>,
      },
    },
  ];

  const columns: DataColumn<FeatureRow>[] = [
    { key: 'feature', header: t('table.feature'), cell: (r) => t(`features.${r.key}`), primary: true, width: '14rem' },
    ...PLANS.map((p) => ({
      key: p.id,
      header: (
        <span className={cn('inline-flex items-center gap-1.5', p.recommended && 'text-primary')}>
          {t(`plans.${p.id}.name`)}
        </span>
      ),
      cell: (r: FeatureRow) => r.values[p.id],
      align: 'center' as const,
      width: '9rem',
    })),
  ];

  return (
    <section aria-labelledby="plans-title" className={cn('@container flex flex-col gap-8', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          {onBack && (
            <Button variant="link" className="w-fit" onClick={onBack}>
              <ArrowLeft className="flip-rtl" aria-hidden />
              {t('back')}
            </Button>
          )}
          <h2 id="plans-title" className="type-h1">
            {t('title')}
          </h2>
          <p className="type-body-lg text-fg-secondary">{t('subtitle')}</p>
          <DemoBadge label={t('proposalBadge')} />
        </div>
        <div className="border-border bg-surface w-full rounded-xl border p-4 @3xl:w-80">
          <p className="type-caption text-fg-muted mb-2">
            {guest ? t('current.guest') : t('current.label', { plan: t(`plans.${current ?? 'free'}.name`) })}
          </p>
          <CreditMeter balance={snapshot.balance} compact />
        </div>
      </div>

      {/* Billing interval */}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label={t('intervalLabel')}
          value={interval}
          onValueChange={setBillingInterval}
          options={[
            { value: 'monthly', label: t('interval.monthly') },
            { value: 'annual', label: t('interval.annual') },
          ]}
        />
        <p className="type-caption text-fg-muted">{t('intervalNote')}</p>
      </div>

      {/* Plan cards */}
      <ul className="grid grid-cols-1 gap-4 @3xl:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = !guest && current === plan.id;
          const e = plan.entitlements;
          return (
            <li key={plan.id} className="flex">
              <article
                aria-labelledby={`plan-${plan.id}`}
                className={cn(
                  'border-border bg-surface relative flex w-full flex-col gap-5 rounded-xl border p-6',
                  plan.recommended && 'border-primary/50 shadow-md ring-primary/20 ring-4',
                  isCurrent && 'bg-surface-brand',
                )}
              >
                {plan.recommended && (
                  <span className="bg-cta text-on-cta absolute -top-3 start-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-sm">
                    <Sparkles className="size-3.5" aria-hidden />
                    {t('recommended')}
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid size-11 place-items-center rounded-lg [&_svg]:size-5',
                        plan.id === 'free' && 'bg-surface-muted text-fg-secondary',
                        plan.id === 'plus' && 'bg-primary-tint text-primary',
                        plan.id === 'premium' && 'bg-pink-tint text-accent-pink',
                      )}
                      aria-hidden
                    >
                      {PLAN_ICON[plan.id]}
                    </span>
                    <div className="flex flex-col">
                      <h3 id={`plan-${plan.id}`} className="type-h3 leading-tight">
                        {t(`plans.${plan.id}.name`)}
                      </h3>
                      <p className="type-caption text-fg-muted">{t(`plans.${plan.id}.tier`)}</p>
                    </div>
                  </div>
                  {isCurrent && <Badge tone="success">{t('currentBadge')}</Badge>}
                </div>

                <div className="flex flex-col gap-0.5">
                  <p className="font-display text-fg text-2xl leading-tight font-bold">{priceLabel(plan)}</p>
                  {plan.prices[interval]?.amount !== 0 && <p className="type-caption text-fg-muted">{t(`price.per.${interval}`)}</p>}
                </div>

                <p className="type-body text-fg-secondary">{t(`plans.${plan.id}.description`)}</p>

                <ul className="flex flex-col gap-2.5 text-[0.9375rem]">
                  <Benefit>{t('benefits.credits', { count: e.monthlyCredits })}</Benefit>
                  <Benefit>{e.proposalsPerMonth === null ? t('benefits.proposalsUnlimited') : t('benefits.proposals', { count: e.proposalsPerMonth })}</Benefit>
                  <Benefit>{e.savedPlans === null ? t('benefits.savedUnlimited') : t('benefits.saved', { count: e.savedPlans })}</Benefit>
                  <Benefit>{t(`benefits.customization.${e.customization}`)}</Benefit>
                  {e.personalization && <Benefit>{t('benefits.personalization')}</Benefit>}
                  {e.enhancedRecommendations && <Benefit>{t('benefits.recommendations')}</Benefit>}
                  {e.priorityResponses === 'future' && <Benefit future>{t('benefits.priorityFuture')}</Benefit>}
                </ul>

                <div className="mt-auto">
                  {isCurrent ? (
                    <Button variant="secondary" fullWidth disabled>
                      {t('cta.current')}
                    </Button>
                  ) : guest ? (
                    <Button variant={plan.recommended ? 'gradient' : 'secondary'} fullWidth onClick={() => setTarget(plan.id)} disabled>
                      {t('cta.signInFirst')}
                    </Button>
                  ) : (
                    <Button variant={plan.recommended ? 'gradient' : 'secondary'} fullWidth onClick={() => setTarget(plan.id)}>
                      {t(`cta.${(PLANS.find((p) => p.id === current)?.order ?? 0) < plan.order ? 'upgrade' : 'switch'}`, { plan: t(`plans.${plan.id}.name`) })}
                    </Button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {guest && <p className="type-body-sm text-fg-secondary -mt-4 font-normal">{t('guestHint')}</p>}

      {/* Comparison */}
      <div className="flex flex-col gap-3">
        <h3 className="type-h3">{t('table.title')}</h3>
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.key}
          caption={t('table.caption')}
          narrow="scroll"
          emptyTitle=""
        />
        <p className="type-caption text-fg-muted">{t('table.note')}</p>
      </div>

      {onBack && (
        <Button variant="ghost" className="self-start" onClick={onBack}>
          {t('notNow')}
        </Button>
      )}

      <ChangePlanDialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)} currentPlan={current} targetPlan={target} interval={interval} />
    </section>
  );
}

function Benefit({ children, future = false }: { children: ReactNode; future?: boolean }) {
  return (
    <li className={cn('flex items-start gap-2.5', future && 'text-fg-muted')}>
      <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', future ? 'bg-surface-muted' : 'bg-success-tint text-success-fg')} aria-hidden>
        {future ? <Minus className="size-3" /> : <Check className="size-3" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </li>
  );
}
