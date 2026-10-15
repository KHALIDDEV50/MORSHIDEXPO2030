'use client';

import { ArrowRight, BellOff, Info, Layers, Map as MapIcon, MessageCircle, Move, Route, Search, Shapes, Smartphone, SquareMousePointer } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { type CSSProperties } from 'react';
import type { Article } from '@/entities/article';
import { localize } from '@/shared/api';
import { SITE_MEDIA, type SiteMedia, type SiteMediaKey } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { zoneColor } from '@/shared/map';
import { Button, Reveal } from '@/shared/ui';
import { ExpoSiteMap } from '@/widgets/expo-site-map';
import { ArrowLink, ChatScreenMock, CtaBand, Eyebrow, ExpoDistrictCards, GuideChatLink, ItineraryDemo, MediaImage, PhoneFrame, PlanScreenMock, Section, SectionHeading } from '@/widgets/public-site';
import { HomeHero } from './home-hero';

/**
 * Home (`/[locale]`) — P-024, Expo-first: Expo 2030 Riyadh is the primary story. Order: the Expo
 * hero; the four thematic districts; the live interactive Expo map; Roaya and Arif as Expo
 * companions (the one sand section); how MORSHID helps plan a visit; then, visually quieter,
 * Riyadh and Saudi destinations for the days around the Expo; the coming app; the journal; the
 * closing invitation. All Expo content is illustrative demo data with concept renderings, and
 * says so; every call to action is a real route.
 */
export function LandingPageView({ articles }: { articles: Article[] }) {
  const t = useTranslations('site.home');
  return (
    <>
      <HomeHero />
      <ZonesSection />
      <MapShowcase />
      <GuidesSection />
      <HelpSection />
      <BeyondExpo />
      <MobileTeaser />
      <JournalTeaser articles={articles} />
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/chat', label: t('final.primary') }} secondary={{ href: '/login', label: t('final.secondary') }} media={SITE_MEDIA.expoSiteDusk} />
    </>
  );
}

// ───────────── The four thematic districts ─────────────

function ZonesSection() {
  const t = useTranslations('site.home.zones');

  return (
    <Section labelledBy="zones-title">
      <SectionHeading id="zones-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
      <ExpoDistrictCards />

      {/* The central plaza (a hub, not a theme) and the honesty note */}
      <div className="border-border -mt-4 grid gap-4 border-t pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
        <Link href="/expo?zone=zone_plaza" className="group focus-ring flex items-start gap-3 rounded-xl">
          <span aria-hidden className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: zoneColor('cyan'), boxShadow: `0 0 0 4px color-mix(in oklab, ${zoneColor('cyan')} 30%, transparent)` }} />
          <span className="flex flex-col gap-1">
            <span className="group-hover:text-primary font-bold transition-colors">{t('plaza.title')}</span>
            <span className="text-fg-secondary text-sm">{t('plaza.body')}</span>
          </span>
        </Link>
        <p role="note" className="text-fg-muted flex items-start gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('note')}
        </p>
      </div>
    </Section>
  );
}

// ───────────── The live interactive Expo map ─────────────

function MapShowcase() {
  const t = useTranslations('site.home.map');
  const points = [
    { key: 'pan', icon: <Move /> },
    { key: 'zone', icon: <Layers /> },
    { key: 'pavilion', icon: <SquareMousePointer /> },
  ] as const;

  return (
    <Section labelledBy="map-title" className="border-border border-t">
      <SectionHeading
        id="map-title"
        eyebrow={t('eyebrow')}
        title={t('title')}
        intro={t('intro')}
        actions={
          <Button asChild variant="gradient">
            <Link href="/expo">
              <MapIcon aria-hidden />
              {t('cta')}
            </Link>
          </Button>
        }
      />
      {/* The real map widget (the same one as /expo), not a picture of it */}
      <ExpoSiteMap className="h-[34rem] shadow-lg sm:h-[38rem] lg:h-[44rem]" />
      <div className="flex flex-col gap-6">
        <ul className="grid gap-5 sm:grid-cols-3">
          {points.map((p, i) => (
            <Reveal as="li" key={p.key} delay={i * 90} className="flex gap-3">
              <span className="text-primary mt-0.5 [&_svg]:size-5" aria-hidden>
                {p.icon}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-bold">{t(`points.${p.key}.title`)}</span>
                <span className="text-fg-secondary text-sm">{t(`points.${p.key}.body`)}</span>
              </span>
            </Reveal>
          ))}
        </ul>
        <p className="text-fg-muted inline-flex items-start gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('note')}
        </p>
      </div>
    </Section>
  );
}

// ───────────── Roaya & Arif — Expo companions (the one sand section) ─────────────

function GuidesSection() {
  const t = useTranslations('site.home.guides');
  const tc = useTranslations('characters');
  const guides = [
    { id: 'roaya', tint: 'bg-roaya-tint', text: 'text-roaya-fg' },
    { id: 'arif', tint: 'bg-arif-tint', text: 'text-arif-fg' },
  ] as const;

  return (
    <Section tone="sand" labelledBy="guides-title">
      <SectionHeading id="guides-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} actions={<ArrowLink href="/guides">{t('link')}</ArrowLink>} />
      <div className="grid gap-6 md:grid-cols-2">
        {guides.map((g, i) => (
          <Reveal key={g.id} delay={i * 120} className="bg-surface border-border group flex flex-col overflow-hidden rounded-[1.75rem] border shadow-sm sm:flex-row md:flex-col xl:flex-row">
            <div className={cn('relative flex h-72 shrink-0 items-end justify-center overflow-hidden sm:h-auto sm:w-[44%] md:h-72 md:w-auto xl:h-auto xl:w-[44%]', g.tint)}>
              <Image
                src={`/images/characters/${g.id}-full.png`}
                alt={tc(`${g.id}.alt`)}
                width={360}
                height={480}
                className="motion-rise relative h-64 w-auto object-contain drop-shadow-xl transition-transform duration-700 group-hover:-translate-y-1 sm:h-80"
                style={{ '--delay': `${200 + i * 200}ms` } as CSSProperties}
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6 sm:py-8">
              <span className={cn('eyebrow', g.text)}>{t(`${g.id}.kicker`)}</span>
              <h3 className="font-display text-4xl font-extrabold">{tc(`${g.id}.name`)}</h3>
              <p className="font-display text-fg text-lg leading-snug font-bold">{t(`${g.id}.line`)}</p>
              <p className="text-fg-secondary text-[0.9375rem]">{t(`${g.id}.body`)}</p>
              <GuideChatLink character={g.id} className="focus-ring bg-cta text-on-cta shadow-glow mt-auto inline-flex h-11 w-fit items-center gap-2 rounded-full px-5 text-sm font-medium transition-opacity hover:opacity-90">
                <MessageCircle className="size-4" aria-hidden />
                {t('chatWith', { name: tc(`${g.id}.name`) })}
              </GuideChatLink>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ───────────── How MORSHID helps at the Expo ─────────────

function HelpSection() {
  const t = useTranslations('site.home.help');
  const steps = [
    { key: 'discover', icon: <Search /> },
    { key: 'themes', icon: <Shapes /> },
    { key: 'organise', icon: <Route /> },
  ] as const;

  return (
    <Section labelledBy="help-title">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-8">
          <SectionHeading id="help-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
          <ol className="border-border flex flex-col border-t">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.key} delay={i * 90} className="border-border flex gap-4 border-b py-5">
                <span className="bg-cta text-on-cta grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-4" aria-hidden>
                  {s.icon}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-lg font-bold">{t(`steps.${s.key}.title`)}</span>
                  <span className="text-fg-secondary text-[0.9375rem]">{t(`steps.${s.key}.body`)}</span>
                </span>
              </Reveal>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild variant="gradient" className="group">
              <GuideChatLink character="roaya">
                {t('cta')}
                <ArrowRight className="nudge flip-rtl" aria-hidden />
              </GuideChatLink>
            </Button>
            <ArrowLink href="/how-it-works">{t('link')}</ArrowLink>
          </div>
        </div>
        <ItineraryDemo variant="expo" />
      </div>
    </Section>
  );
}

// ───────────── Beyond the Expo — Riyadh and the Kingdom (secondary, quieter) ─────────────

const BEYOND: { key: 'turaif' | 'masmak' | 'kafd' | 'alula' | 'asir' | 'ahsa'; media: SiteMedia; href: string }[] = [
  { key: 'turaif', media: SITE_MEDIA.turaif, href: '/destinations#riyadh' },
  { key: 'masmak', media: SITE_MEDIA.masmak, href: '/destinations#riyadh' },
  { key: 'kafd', media: SITE_MEDIA.kafd, href: '/destinations#riyadh' },
  { key: 'alula', media: SITE_MEDIA.elephantRock, href: '/destinations#saudi' },
  { key: 'asir', media: SITE_MEDIA.rijalAlmaa, href: '/destinations#saudi' },
  { key: 'ahsa', media: SITE_MEDIA.alQarah, href: '/destinations#saudi' },
];

/** Deliberately smaller than the Expo sections: a compact heading and a row of small photos. */
function BeyondExpo() {
  const t = useTranslations('site.home.beyond');
  return (
    <Section labelledBy="beyond-title" className="border-border border-t">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <Eyebrow tone="muted">{t('eyebrow')}</Eyebrow>
          <h2 id="beyond-title" className="type-h2 [text-wrap:balance]">
            {t('title')}
          </h2>
          <p className="text-fg-secondary text-[0.9375rem]">{t('intro')}</p>
        </div>
        <ArrowLink href="/destinations">{t('link')}</ArrowLink>
      </div>
      <ul className="-mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {BEYOND.map((b, i) => (
          <Reveal as="li" key={b.key} delay={i * 60} className="flex flex-col gap-2">
            <MediaImage media={b.media} sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 50vw" className="aspect-[4/3] rounded-xl" />
            <Link href={b.href} className="focus-ring hover:text-primary flex flex-col rounded-sm transition-colors">
              <span className="text-fg-muted text-[0.6875rem] font-bold">{t(`items.${b.key}.region`)}</span>
              <span className="text-sm leading-snug font-bold">{t(`items.${b.key}.title`)}</span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

// ───────────── The coming mobile app ─────────────

function MobileTeaser() {
  const t = useTranslations('site.home.mobile');
  const ts = useTranslations('site');
  return (
    <Section labelledBy="mobile-title">
      <Reveal className="bg-sand relative grid items-end gap-10 overflow-hidden rounded-[2rem] px-6 pt-12 sm:px-12 lg:grid-cols-2">
        <div className="flex flex-col gap-5 pb-4 lg:pb-16">
          <span className="bg-surface text-accent-pink inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
            <Smartphone className="size-3.5" aria-hidden />
            {t('badge')}
          </span>
          <h2 id="mobile-title" className="type-statement [text-wrap:balance]">
            {t('title')}
          </h2>
          <p className="type-body-lg text-fg-secondary max-w-xl">{t('body')}</p>
          <p className="text-fg-muted inline-flex items-start gap-2 text-sm">
            <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('noStores')}
          </p>
          <ArrowLink href="/mobile-app">{t('link')}</ArrowLink>
        </div>
        <div className="relative flex h-[24rem] justify-center gap-5 overflow-hidden sm:h-[28rem] lg:justify-end">
          <PhoneFrame label={ts('sampleScreen')} className="w-[14.5rem] translate-y-6 sm:w-[16rem]">
            <PlanScreenMock />
          </PhoneFrame>
          <PhoneFrame label={ts('sampleScreen')} className="hidden w-[14.5rem] translate-y-16 sm:block sm:w-[16rem]">
            <ChatScreenMock />
          </PhoneFrame>
        </div>
      </Reveal>
    </Section>
  );
}

// ───────────── Journal ─────────────

function JournalTeaser({ articles }: { articles: Article[] }) {
  const t = useTranslations('site.home.journal');
  const tj = useTranslations('site.journal');
  const locale = useLocale();
  const featured = articles.slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <Section labelledBy="journal-title" className="border-border border-t">
      <SectionHeading id="journal-title" eyebrow={t('eyebrow')} title={t('title')} actions={<ArrowLink href="/blog">{t('link')}</ArrowLink>} />
      <ul className="grid gap-x-6 gap-y-10 md:grid-cols-3">
        {featured.map((a, i) => (
          <Reveal as="li" key={a.slug} delay={i * 90} className={cn(i === 1 && 'md:mt-10')}>
            <Link href={`/blog/${a.slug}`} className="group focus-ring flex h-full flex-col gap-4 rounded-[1.5rem]">
              <MediaImage media={SITE_MEDIA[a.cover as SiteMediaKey]} sizes="(min-width: 768px) 33vw, 100vw" credit="none" className="aspect-[4/3] rounded-[1.5rem]" imageClassName="transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100" />
              <span className="flex flex-col gap-2">
                <span className="eyebrow text-accent-pink">{tj(`categories.${a.category}`)}</span>
                <span className="font-display group-hover:text-primary text-xl leading-snug font-bold transition-colors">{localize(a.title, locale)}</span>
                <span className="text-fg-secondary line-clamp-2 text-[0.9375rem]">{localize(a.excerpt, locale)}</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
