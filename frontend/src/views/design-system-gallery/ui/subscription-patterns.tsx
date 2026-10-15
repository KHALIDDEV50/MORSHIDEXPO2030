'use client';

import { Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { LimitNotice, subscriptionStore, useSubscriptionSnapshot, type DemoProfile } from '@/entities/subscription';
import { useSpendCredits } from '@/features/manage-subscription';
import { Button, DemoBadge, SegmentedControl, toast } from '@/shared/ui';
import { SubscriptionPlans } from '@/widgets/subscription-plans';
import { SubscriptionSettings } from '@/widgets/subscription-settings';
import { DemoBlock, GallerySection } from './section';

const PROFILES: DemoProfile[] = ['guest', 'free', 'free_low', 'plus', 'plus_expiring', 'premium'];

export function SubscriptionPatterns() {
  const t = useTranslations('designSystem.subscription');
  const ts = useTranslations('subscription');
  const spend = useSpendCredits();
  const { subscription } = useSubscriptionSnapshot();
  const [profile, setProfile] = useState<DemoProfile>('free');
  const [blocked, setBlocked] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  const loadProfile = (p: DemoProfile) => {
    setProfile(p);
    setBlocked(false);
    subscriptionStore.loadDemoProfile(p);
  };

  const simulateReply = async () => {
    const ok = await spend('ai_reply');
    setBlocked(!ok);
    if (ok) toast(t('spentToast'));
  };

  return (
    <GallerySection id="subscription" title={t('title')} description={t('description')}>
      <DemoBlock label={t('controls')} className="flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <DemoBadge label={t('demoData')} />
          <SegmentedControl label={t('profile')} value={profile} onValueChange={loadProfile} options={PROFILES.map((p) => ({ value: p, label: t(`profiles.${p}`) }))} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={simulateReply}>
            <Bot aria-hidden />
            {t('simulateReply')}
          </Button>
          <span className="type-caption text-fg-muted">{t('simulateNote')}</span>
        </div>
        {blocked && (
          <LimitNotice
            kind="out_of_credits"
            action={
              subscription ? (
                <Button size="sm" variant="gradient" onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  {ts('limits.upgradeCta')}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => loadProfile('free')}>
                  {ts('settings.signIn')}
                </Button>
              )
            }
          />
        )}
      </DemoBlock>

      <div ref={plansRef} className="scroll-mt-28">
        <DemoBlock label={t('plansPage')} className="block">
          <SubscriptionPlans onBack={() => toast(t('backToast'))} />
        </DemoBlock>
      </div>

      <DemoBlock label={t('settingsSection')} className="block">
        <SubscriptionSettings onChangePlan={() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      </DemoBlock>
    </GallerySection>
  );
}
