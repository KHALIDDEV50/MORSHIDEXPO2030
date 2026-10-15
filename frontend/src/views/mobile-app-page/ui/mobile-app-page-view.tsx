'use client';

import { ArrowRight, BellOff, Compass, Globe, MessageCircle, Route, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { SITE_MEDIA } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { Button, Reveal } from '@/shared/ui';
import { ChatScreenMock, CtaBand, DiscoverScreenMock, PhoneFrame, PlanScreenMock, Section, SectionHeading, StatusTag } from '@/widgets/public-site';

const SCREENS = [
  { key: 'chat', icon: <MessageCircle />, screen: <ChatScreenMock animate /> },
  { key: 'discover', icon: <Compass />, screen: <DiscoverScreenMock /> },
  { key: 'plan', icon: <Route />, screen: <PlanScreenMock /> },
] as const;

/**
 * Mobile app (`/[locale]/mobile-app`): a "Coming soon" page. There is no store listing, release
 * date or sign-up list, so none is shown or implied: store availability is plain status text,
 * and the interest form is replaced by an explanation (no server can store an email safely yet).
 * The phones are stylised previews built from the real design system.
 */
export function MobileAppPageView() {
  const t = useTranslations('site.mobile');
  return (
    <>
      <Hero />
      <Moments />
      <Exploring />
      <Section labelledBy="notify-title">
        <Reveal className="bg-surface border-border mx-auto flex w-full max-w-3xl flex-col items-start gap-4 rounded-[1.75rem] border p-6 shadow-sm sm:p-10">
          <span className="bg-sand text-accent-pink grid size-12 place-items-center rounded-2xl">
            <BellOff className="size-6" aria-hidden />
          </span>
          <h2 id="notify-title" className="type-h1">
            {t('notify.title')}
          </h2>
          <p className="type-body-lg text-fg-secondary">{t('notify.body')}</p>
          <Button asChild variant="secondary" className="group">
            <Link href="/chat">
              <Globe aria-hidden />
              {t('notify.cta')}
              <ArrowRight className="nudge flip-rtl" aria-hidden />
            </Link>
          </Button>
        </Reveal>
      </Section>
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/chat', label: t('final.primary') }} secondary={{ href: '/features', label: t('final.secondary') }} media={SITE_MEDIA.kafd} />
    </>
  );
}

function Hero() {
  const t = useTranslations('site.mobile');
  const [screen, setScreen] = useState(0);

  return (
    <section aria-labelledby="page-title" className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-32 pb-16 sm:px-6 sm:pt-36 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pb-24">
        <div className="flex flex-col gap-6">
          <span className="motion-rise bg-surface border-border text-accent-pink inline-flex w-fit items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-bold shadow-xs">
            <span className="relative grid size-2.5 place-items-center" aria-hidden>
              <span className="motion-ping bg-accent-pink absolute inset-0 rounded-full" />
              <span className="bg-accent-pink relative size-2.5 rounded-full" />
            </span>
            {t('hero.badge')}
          </span>
          <h1 id="page-title" className="type-hero [text-wrap:balance]">
            <span className="motion-rise block" style={{ '--delay': '120ms' } as CSSProperties}>
              {t('hero.line1')}
            </span>{' '}
            <span className="motion-rise text-primary block" style={{ '--delay': '260ms' } as CSSProperties}>
              {t('hero.line2')}
            </span>
          </h1>
          <p className="motion-rise type-body-lg text-fg-secondary max-w-xl" style={{ '--delay': '400ms' } as CSSProperties}>
            {t('hero.intro')}
          </p>

          {/* Honest availability — status text, never store buttons */}
          <dl className="motion-rise grid max-w-xl gap-2 sm:grid-cols-2" style={{ '--delay': '520ms' } as CSSProperties}>
            {(['appStore', 'googlePlay'] as const).map((store) => (
              <div key={store} className="border-border-strong bg-surface/60 flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3">
                <Smartphone className="text-fg-muted size-5 shrink-0" aria-hidden />
                <div className="flex flex-col">
                  <dt className="text-sm font-bold">{t(`hero.${store}`)}</dt>
                  <dd className="text-fg-muted text-xs">{t('hero.notAvailable')}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="motion-rise text-fg-muted text-sm" style={{ '--delay': '600ms' } as CSSProperties}>
            {t('hero.noDate')}
          </p>
          <div className="motion-rise flex flex-wrap gap-3" style={{ '--delay': '680ms' } as CSSProperties}>
            <Button asChild variant="gradient" size="lg" className="group">
              <Link href="/chat">
                {t('hero.cta')}
                <ArrowRight className="nudge flip-rtl" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        {/* Interactive device: switch between the three screens */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-[34rem] w-full items-center justify-center sm:h-[38rem]">
            <div aria-hidden className="bg-sand absolute inset-x-[6%] top-[12%] bottom-0 rounded-t-full" />
            {SCREENS.map((s, i) => {
              const offset = (i - screen + SCREENS.length) % SCREENS.length; // 0 = front
              return (
                <PhoneFrame
                  key={s.key}
                  label={t(`hero.screens.${s.key}`)}
                  className={cn(
                    'absolute w-[15rem] transition-[translate,scale,opacity,rotate] duration-700 ease-[cubic-bezier(0.3,0,0,1)] sm:w-[17rem]',
                    offset === 0 && 'z-[3] scale-100 rotate-0 opacity-100',
                    offset === 1 && 'z-[2] translate-x-[38%] scale-[0.86] rotate-6 opacity-50 rtl:-translate-x-[38%] rtl:-rotate-6',
                    offset === 2 && 'z-[1] -translate-x-[38%] scale-[0.86] -rotate-6 opacity-50 rtl:translate-x-[38%] rtl:rotate-6',
                  )}
                  style={{ pointerEvents: offset === 0 ? 'auto' : 'none' }}
                >
                  {offset === 0 ? <div key={screen} className="animate-fade-in flex flex-1 flex-col overflow-hidden">{s.screen}</div> : s.screen}
                </PhoneFrame>
              );
            })}
          </div>
          <div role="group" aria-label={t('hero.screensLabel')} className="bg-surface border-border flex gap-1 rounded-full border p-1 shadow-sm">
            {SCREENS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={screen === i}
                onClick={() => setScreen(i)}
                className={cn('focus-ring inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors [&_svg]:size-4', screen === i ? 'bg-cta text-on-cta' : 'text-fg-secondary hover:text-fg')}
              >
                {s.icon}
                {t(`hero.screens.${s.key}`)}
              </button>
            ))}
          </div>
          <p className="text-fg-muted text-xs">{t('hero.previewNote')}</p>
        </div>
      </div>
    </section>
  );
}

function Moments() {
  const t = useTranslations('site.mobile.moments');
  const ts = useTranslations('site');
  const items: { key: 'chat' | 'discover' | 'plan'; screen: ReactNode }[] = [
    { key: 'chat', screen: <ChatScreenMock /> },
    { key: 'discover', screen: <DiscoverScreenMock /> },
    { key: 'plan', screen: <PlanScreenMock /> },
  ];
  return (
    <Section labelledBy="moments-title" className="border-border border-t">
      <SectionHeading id="moments-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
      <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
        {items.map((item, i) => (
          <Reveal as="li" key={item.key} delay={i * 140} className={cn('flex flex-col items-center gap-6 text-center', i === 1 && 'md:mt-16')}>
            <PhoneFrame label={ts('sampleScreen')} className="w-[14rem] transition-transform duration-500 hover:-translate-y-2">
              {item.screen}
            </PhoneFrame>
            <div className="flex max-w-xs flex-col gap-2">
              <h3 className="font-display text-xl font-bold">{t(`${item.key}.title`)}</h3>
              <p className="text-fg-secondary text-[0.9375rem]">{t(`${item.key}.body`)}</p>
              <StatusTag status="live" className="mx-auto" />
              <span className="type-caption text-fg-muted">{t('onWeb')}</span>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

function Exploring() {
  const t = useTranslations('site.mobile.exploring');
  return (
    <Section tone="sand" labelledBy="exploring-title">
      <SectionHeading id="exploring-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(['offline', 'reminders', 'voice', 'home'] as const).map((k, i) => (
          <Reveal as="li" key={k} delay={i * 90} className="border-border bg-surface flex flex-col gap-3 rounded-[1.5rem] border p-5 shadow-xs">
            <StatusTag status="planned" />
            <h3 className="font-display text-lg font-bold">{t(`items.${k}.title`)}</h3>
            <p className="text-fg-secondary text-sm">{t(`items.${k}.body`)}</p>
          </Reveal>
        ))}
      </ul>
      <p className="type-caption text-fg-muted">{t('note')}</p>
    </Section>
  );
}
