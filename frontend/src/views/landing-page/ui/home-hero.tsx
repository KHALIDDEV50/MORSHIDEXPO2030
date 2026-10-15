'use client';

import { ArrowRight, Compass, Info, Map as MapIcon, MessageCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type CSSProperties } from 'react';
import { CharacterAvatar } from '@/entities/ai-character';
import { SITE_MEDIA } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { GuideChatLink, HeadlineLines, MediaCredit, MediaImage, SaduBand } from '@/widgets/public-site';

/**
 * Home opening (P-024, Expo-first): Expo 2030 Riyadh is the story. The promise and the two
 * ways in (the interactive map, a plan with Roaya) on top; below, a panoramic stage with the
 * night concept rendering of the future site — the user's reference image, always labelled as a
 * concept rendering, never a photograph or the official plan. The BIE dates and theme keep their
 * source, and one note says plainly what is illustrative. Riyadh and Saudi discovery stay one
 * quiet link away.
 */
export function HomeHero() {
  const t = useTranslations('site.home.hero');
  const media = SITE_MEDIA.expoSiteNight;

  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-28 pb-14 sm:px-6 sm:pt-32 lg:pb-20">
        {/* The promise and the two ways in */}
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="motion-rise text-primary inline-flex w-fit items-center gap-2 text-sm font-bold">
              <Sparkles className="text-accent-pink size-4" aria-hidden />
              {t('eyebrow')}
            </span>
            <HeadlineLines id="hero-title" lines={[t('line1'), t('line2'), t('line3')]} accent={1} />
          </div>
          <div className="flex flex-col gap-6 lg:pb-3">
            <p className="motion-rise type-body-lg text-fg-secondary max-w-[34rem] [text-wrap:pretty]" style={{ '--delay': '560ms' } as CSSProperties}>
              {t('intro')}
            </p>
            <div className="motion-rise flex flex-wrap gap-3" style={{ '--delay': '680ms' } as CSSProperties}>
              <Button asChild variant="gradient" size="lg" className="group">
                <Link href="/expo">
                  <MapIcon aria-hidden />
                  {t('ctaMap')}
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="group">
                <GuideChatLink character="roaya">
                  <MessageCircle aria-hidden />
                  {t('ctaPlan')}
                </GuideChatLink>
              </Button>
            </div>
            <Link href="/destinations" className="motion-rise group focus-ring text-fg-secondary hover:text-fg inline-flex w-fit items-center gap-2 rounded-sm text-sm font-bold" style={{ '--delay': '760ms' } as CSSProperties}>
              <Compass className="text-primary size-4" aria-hidden />
              {t('ctaDiscover')}
              <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
            </Link>
          </div>
        </div>

        {/* The stage: the night concept rendering, panoramic on large screens */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <MediaImage
              media={media}
              priority
              credit="none"
              sizes="(min-width: 1280px) 80rem, 100vw"
              className="aspect-[4/3] rounded-[2rem] sm:aspect-[2/1] lg:aspect-[1893/607]"
              imageClassName="motion-settle"
            />
            {/* Roaya's welcome (sample) */}
            <div className="bg-surface border-border motion-rise absolute end-4 -bottom-10 flex max-w-[17rem] flex-col gap-2 rounded-2xl border p-4 shadow-lg sm:end-8" style={{ '--delay': '900ms' } as CSSProperties}>
              <div className="flex items-center gap-2">
                <CharacterAvatar id="roaya" size="md" decorative />
                <span className="flex flex-col leading-tight">
                  <span className="text-roaya-fg text-sm font-bold">{t('bubbleAuthor')}</span>
                  <span className="text-fg-muted text-[0.6875rem]">{t('bubbleLabel')}</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">{t('bubble')}</p>
            </div>
          </div>
          <p className="text-fg-secondary flex max-w-[calc(100%-18rem)] flex-wrap items-center gap-x-2 gap-y-1 text-xs max-sm:mt-12 max-sm:max-w-none">
            <span>{t('imageCaption')}</span>
            <MediaCredit media={media} variant="text" className="!text-[0.6875rem]" />
          </p>
        </div>

        {/* What is known (with its source) and what is illustrative */}
        <div className="border-border grid gap-5 border-y py-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
          <div className="flex flex-col gap-3 md:w-[28rem]">
            <dl className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <dt className="type-caption text-fg-muted">{t('datesLabel')}</dt>
              <dd className="font-display text-lg font-bold">{t('dates')}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="type-caption text-fg-muted">{t('themeLabel')}</dt>
              <dd className="font-display text-lg leading-snug font-bold">{t('theme')}</dd>
            </div>
            </dl>
            <p className="type-caption text-fg-muted">{t('source')}</p>
          </div>
          <p role="note" className="border-warning/30 bg-warning-tint text-warning-fg flex h-fit items-start gap-2 rounded-xl border px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('note')}
          </p>
        </div>
      </div>
      <SaduBand />
    </section>
  );
}
