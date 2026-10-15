'use client';

import { ArrowRight, Check, ChevronDown, ExternalLink, GripVertical, Lightbulb, MessageSquareText, X } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CharacterAvatar } from '@/entities/ai-character';
import { localize } from '@/shared/api';
import { SITE_MEDIA, type SiteMedia } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { Button, IllustrativeMap, MapPin, Reveal, RouteLine, RouteMarkerVisual } from '@/shared/ui';
import { CtaBand, PageHero, Section, SectionHeading, StatusTag, type CapabilityStatus } from '@/widgets/public-site';

const STEPS: { key: 'tell' | 'suggest' | 'build' | 'map' | 'manage'; href: string; status: CapabilityStatus }[] = [
  { key: 'tell', href: '/chat', status: 'live' },
  { key: 'suggest', href: '/chat', status: 'simulated' },
  { key: 'build', href: '/plans/new', status: 'live' },
  { key: 'map', href: '/chat?view=map', status: 'live' },
  { key: 'manage', href: '/plans', status: 'live' },
];

/**
 * How it works (`/[locale]/how-it-works`): the journey told as a scroll story. On large screens
 * the visual stays pinned and changes with the step being read; on phones each step carries its
 * own visual. Nothing depends on animation — every step is complete as plain content.
 */
export function HowItWorksPageView() {
  const t = useTranslations('site.how');
  return (
    <>
      <PageHero
        eyebrow={t('hero.eyebrow')}
        titleLines={[t('hero.line1'), t('hero.line2')]}
        accentLine={1}
        intro={t('hero.intro')}
        media={SITE_MEDIA.edgeOfTheWorld}
        actions={
          <Button asChild variant="gradient" size="lg" className="group">
            <Link href="/chat">
              {t('hero.cta')}
              <ArrowRight className="nudge flip-rtl" aria-hidden />
            </Link>
          </Button>
        }
      />
      <Story />
      <Faq />
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/chat', label: t('final.primary') }} secondary={{ href: '/features', label: t('final.secondary') }} media={SITE_MEDIA.salamPark} />
    </>
  );
}

function Story() {
  const t = useTranslations('site.how');
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Section labelledBy="story-title">
      <h2 id="story-title" className="sr-only">
        {t('storyTitle')}
      </h2>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <ol className="relative flex flex-col gap-16 lg:gap-0">
          {/* Progress rail */}
          <span aria-hidden className="bg-border absolute start-[1.375rem] top-2 bottom-2 hidden w-px lg:block" />
          <span aria-hidden className="bg-cta absolute start-[1.375rem] top-2 hidden w-0.5 -translate-x-px rtl:translate-x-px transition-[height] duration-700 lg:block" style={{ height: `${((active + 1) / STEPS.length) * 100}%` }} />
          {STEPS.map((step, i) => (
            <li
              key={step.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step={i}
              className="relative flex flex-col gap-5 lg:min-h-[78vh] lg:justify-center lg:ps-16"
            >
              <div className="flex items-center gap-3">
                <span className={cn('font-display relative z-[1] grid size-11 shrink-0 place-items-center rounded-full text-lg font-extrabold transition-colors duration-500 lg:absolute lg:start-0', active >= i ? 'bg-cta text-on-cta' : 'bg-sand text-fg-muted')}>{i + 1}</span>
                <StatusTag status={step.status} />
              </div>
              <h3 className="type-statement [text-wrap:balance]">{t(`steps.${step.key}.title`)}</h3>
              <p className="type-body-lg text-fg-secondary max-w-xl">{t(`steps.${step.key}.body`)}</p>
              <p className="text-fg-muted flex max-w-xl items-start gap-2 text-sm">
                <Lightbulb className="text-accent-pink mt-0.5 size-4 shrink-0" aria-hidden />
                {t(`steps.${step.key}.tip`)}
              </p>
              <Link href={step.href} className="group focus-ring text-primary inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-bold">
                {t(`steps.${step.key}.cta`)}
                <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
              </Link>
              {/* Phones / tablets: the visual sits with its step */}
              <Reveal variant="scale" className="lg:hidden">
                <StepVisual step={step.key} />
              </Reveal>
            </li>
          ))}
        </ol>

        {/* Large screens: one pinned stage that changes with the step */}
        <div className="hidden lg:block">
          <div className="sticky top-28 h-[36rem]">
            {STEPS.map((step, i) => (
              <div
                key={step.key}
                aria-hidden={active !== i}
                className={cn('absolute inset-0 transition-[opacity,translate,scale] duration-700 ease-out', active === i ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-6 scale-[0.97] opacity-0')}
              >
                <StepVisual step={step.key} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ───────────── Visuals (sample content) ─────────────

function Stage({ children, className }: { children: ReactNode; className?: string }) {
  const t = useTranslations('site.how');
  return (
    <div className={cn('bg-surface text-fg border-border relative flex h-full min-h-[26rem] flex-col gap-4 overflow-hidden rounded-[1.75rem] border p-5 shadow-md sm:p-7', className)}>
      <span className="bg-sand text-fg-secondary relative z-[2] w-fit rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold">{t('sample')}</span>
      {children}
    </div>
  );
}

function StepVisual({ step }: { step: (typeof STEPS)[number]['key'] }) {
  switch (step) {
    case 'tell':
      return <TellVisual />;
    case 'suggest':
      return <SuggestVisual />;
    case 'build':
      return <BuildVisual />;
    case 'map':
      return <MapVisual />;
    case 'manage':
      return <ManageVisual />;
  }
}

function TellVisual() {
  const t = useTranslations('site.how.visuals.tell');
  return (
    <Stage>
      <div className="relative flex flex-1 flex-col justify-center gap-5">
        <p className="font-display text-2xl leading-snug font-bold sm:text-3xl">{t('prompt')}</p>
        <div className="flex flex-wrap gap-2">
          {(['c1', 'c2', 'c3', 'c4'] as const).map((c) => (
            <span key={c} className="bg-ivory border-border rounded-full border px-3 py-1.5 text-xs font-bold">
              {t(`chips.${c}`)}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-ivory border-border relative flex items-center gap-2 rounded-full border p-1.5 ps-4">
        <MessageSquareText className="text-fg-muted size-4" aria-hidden />
        <span className="text-fg-muted flex-1 truncate text-sm">{t('placeholder')}</span>
        <span className="bg-cta text-on-cta grid size-9 place-items-center rounded-full">
          <ArrowRight className="flip-rtl size-4" aria-hidden />
        </span>
      </div>
    </Stage>
  );
}

function SuggestVisual() {
  const t = useTranslations('site.how.visuals.suggest');
  const locale = useLocale();
  const items: { key: 's1' | 's2' | 's3'; media: SiteMedia }[] = [
    { key: 's1', media: SITE_MEDIA.nationalMuseum },
    { key: 's2', media: SITE_MEDIA.salamPark },
    { key: 's3', media: SITE_MEDIA.turaif },
  ];
  return (
    <Stage>
      <div className="relative flex items-end gap-2.5">
        <CharacterAvatar id="roaya" size="md" decorative />
        <p className="bg-ivory border-border rounded-2xl rounded-es-md border px-4 py-2.5 text-sm">{t('answer')}</p>
      </div>
      <ul className="relative flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.key} className="bg-ivory border-border flex items-center gap-3 rounded-2xl border p-2.5">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
              <Image src={item.media.src} alt={localize(item.media.alt, locale)} fill sizes="3.5rem" className="object-cover" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{t(`items.${item.key}.name`)}</span>
              <span className="text-fg-secondary text-xs">{t(`items.${item.key}.why`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Stage>
  );
}

function BuildVisual() {
  const t = useTranslations('site.how.visuals.build');
  const rows = [
    { key: 'r1', removed: false },
    { key: 'r2', removed: true },
    { key: 'r3', removed: false },
    { key: 'r4', removed: false },
  ] as const;
  return (
    <Stage>
      <p className="relative text-sm font-bold">{t('title')}</p>
      <ol className="relative flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={row.key} className={cn('bg-ivory border-border flex items-center gap-3 rounded-xl border p-3', row.removed && 'opacity-45', i === 2 && 'border-primary shadow-glow translate-x-2 rtl:-translate-x-2')}>
            <GripVertical className="text-fg-muted size-4" aria-hidden />
            <span className={cn('flex-1 text-sm font-bold', row.removed && 'line-through')}>{t(`rows.${row.key}`)}</span>
            {row.removed ? <X className="text-error-fg size-4" aria-hidden /> : <Check className="text-success-fg size-4" aria-hidden />}
          </li>
        ))}
      </ol>
      <p className="text-fg-secondary relative text-xs">{t('note')}</p>
    </Stage>
  );
}

function MapVisual() {
  const t = useTranslations('site.how.visuals.map');
  const pts: [number, number][] = [
    [22, 70],
    [44, 42],
    [70, 56],
    [80, 24],
  ];
  return (
    <Stage className="p-0 sm:p-0">
      <IllustrativeMap label={t('label')} className="absolute inset-0">
        <RouteLine points={pts} progressIndex={1} />
        {pts.map(([x, y], i) => (
          <MapPin key={i} x={x} y={y}>
            <RouteMarkerVisual number={i + 1} status={i === 0 ? 'completed' : i === 1 ? 'current' : 'upcoming'} />
          </MapPin>
        ))}
      </IllustrativeMap>
      <div className="glass border-border absolute inset-x-4 bottom-4 flex flex-col gap-1 rounded-2xl border p-4">
        <span className="text-sm font-bold">{t('card')}</span>
        <span className="text-fg-secondary text-xs">{t('cardBody')}</span>
      </div>
    </Stage>
  );
}

function ManageVisual() {
  const t = useTranslations('site.how.visuals.manage');
  return (
    <Stage>
      <div className="relative flex items-center justify-between text-xs font-bold">
        <span>{t('progress')}</span>
        <span className="text-fg-muted">{t('left')}</span>
      </div>
      <div className="relative grid grid-cols-3 gap-1.5">
        <span className="bg-success h-1.5 rounded-full" />
        <span className="bg-cta h-1.5 rounded-full" />
        <span className="bg-surface-muted h-1.5 rounded-full" />
      </div>
      <div className="bg-ivory border-border relative flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border">
        <div className="relative h-40">
          <Image src={SITE_MEDIA.murabba.src} alt="" fill sizes="30rem" className="object-cover" />
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <span className="eyebrow text-primary">{t('now')}</span>
          <span className="font-display text-xl font-bold">{t('stop')}</span>
          <span className="text-fg-secondary text-sm">{t('stopBody')}</span>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="bg-cta text-on-cta inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium">
              <Check className="size-4" aria-hidden />
              {t('done')}
            </span>
            <span className="border-border-strong inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm">
              <ExternalLink className="size-4" aria-hidden />
              {t('directions')}
            </span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

// ───────────── Good to know ─────────────

function Faq() {
  const t = useTranslations('site.how.faq');
  const items = ['account', 'cost', 'ai', 'location', 'expo', 'data'] as const;
  return (
    <Section tone="sand" labelledBy="faq-title">
      <SectionHeading id="faq-title" eyebrow={t('eyebrow')} title={t('title')} />
      <div className="border-border bg-surface divide-border divide-y rounded-[1.5rem] border">
        {items.map((k) => (
          <details key={k} className="group px-5 sm:px-6">
            <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-5 font-bold [&::-webkit-details-marker]:hidden">
              {t(`items.${k}.q`)}
              <ChevronDown className="text-fg-muted size-5 shrink-0 transition-transform duration-300 group-open:rotate-180" aria-hidden />
            </summary>
            <p className="text-fg-secondary pb-5 text-[0.9375rem] leading-relaxed">{t(`items.${k}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
