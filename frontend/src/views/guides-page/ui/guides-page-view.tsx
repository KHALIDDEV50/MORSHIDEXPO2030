'use client';

import { Check, Coffee, MessageCircle, Mic } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import type { CharacterId } from '@/entities/ai-character';
import { SITE_MEDIA, type SiteMedia } from '@/shared/content';
import { cn } from '@/shared/lib';
import { useParallax } from '@/shared/lib/use-motion';
import { Reveal } from '@/shared/ui';
import { CtaBand, Eyebrow, GuideChatLink, MediaImage, PageHero, Section, SectionHeading, StatusTag } from '@/widgets/public-site';

type GuideStyle = { id: CharacterId; setting: SiteMedia; tint: string; text: string; ring: string; reverse: boolean };

const GUIDES: GuideStyle[] = [
  { id: 'arif', setting: SITE_MEDIA.turaif, tint: 'bg-arif-tint', text: 'text-arif-fg', ring: 'border-arif/30 hover:border-arif/60', reverse: false },
  { id: 'roaya', setting: SITE_MEDIA.kafd, tint: 'bg-roaya-tint', text: 'text-roaya-fg', ring: 'border-roaya/30 hover:border-roaya/60', reverse: true },
];

/**
 * Meet your guides (`/[locale]/guides`), P-021: light and warm. Arif (heritage storyteller, teal,
 * set in At-Turaif) and Roaya (calm planner, violet, set against today's skyline) keep their
 * established identities; the page opens with Saudi hospitality — they listen first, then
 * suggest. Voice is labelled as browser speech + demo replies.
 */
export function GuidesPageView() {
  const t = useTranslations('site.guides');
  return (
    <>
      <PageHero
        eyebrow={t('hero.eyebrow')}
        titleLines={[t('hero.line1'), t('hero.line2')]}
        accentLine={1}
        intro={t('hero.intro')}
        aside={
          <div className="relative mx-auto flex h-80 w-full max-w-md items-end justify-center sm:h-[26rem]" aria-hidden>
            <div className="bg-sand absolute inset-x-4 bottom-0 h-[85%] rounded-t-full" />
            <Image src="/images/characters/arif-full.png" alt="" width={360} height={480} priority className="motion-rise relative h-72 w-auto object-contain drop-shadow-xl sm:h-[23rem]" style={{ '--delay': '300ms' } as CSSProperties} />
            <Image src="/images/characters/roaya-full.png" alt="" width={360} height={480} priority className="motion-rise relative -ms-10 h-68 w-auto object-contain drop-shadow-xl sm:h-[22rem]" style={{ '--delay': '520ms' } as CSSProperties} />
          </div>
        }
      />

      {/* Hospitality — the one sand section on this page */}
      <Section tone="sand" labelledBy="welcome-title">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <span className="bg-surface text-accent-pink grid size-14 place-items-center rounded-full shadow-sm">
            <Coffee className="size-6" aria-hidden />
          </span>
          <h2 id="welcome-title" className="type-statement [text-wrap:balance]">
            {t('welcome.title')}
          </h2>
          <p className="type-body-lg text-fg-secondary max-w-[38rem]">{t('welcome.body')}</p>
        </Reveal>
      </Section>

      {GUIDES.map((g) => (
        <GuideChapter key={g.id} guide={g} />
      ))}
      <WhoToAsk />
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/chat', label: t('final.primary') }} secondary={{ href: '/how-it-works', label: t('final.secondary') }} media={SITE_MEDIA.masmak} />
    </>
  );
}

function GuideChapter({ guide }: { guide: GuideStyle }) {
  const t = useTranslations(`site.guides.${guide.id}`);
  const tc = useTranslations('characters');
  const parallax = useParallax<HTMLDivElement>(0.04);
  const name = tc(`${guide.id}.name`);

  return (
    <Section id={guide.id} labelledBy={`${guide.id}-title`} className="border-border border-t">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Portrait: the character in their colour arch, their setting in a Najdi frame behind */}
        <div className={cn('relative mx-auto w-full max-w-md', guide.reverse && 'lg:order-2')}>
          <MediaImage media={guide.setting} frame="najdi" reveal="scale" sizes="(min-width: 1024px) 24vw, 60vw" className={cn('absolute top-0 aspect-[3/4] w-[58%] rounded-b-[1.5rem]', guide.reverse ? 'start-0' : 'end-0')} />
          <div className={cn('relative mt-24 flex h-[26rem] items-end justify-center overflow-hidden rounded-t-full sm:h-[30rem]', guide.tint, guide.reverse ? 'me-[22%]' : 'ms-[22%]')}>
            <div ref={parallax} data-parallax>
              <Image src={`/images/characters/${guide.id}-full.png`} alt={tc(`${guide.id}.alt`)} width={420} height={560} className="motion-rise h-[23rem] w-auto object-contain drop-shadow-xl sm:h-[27rem]" style={{ '--delay': '200ms' } as CSSProperties} />
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="flex flex-col gap-6">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow tone="muted" className={guide.text}>
              {t('kicker')}
            </Eyebrow>
            <h2 id={`${guide.id}-title`} className="type-hero">
              {name}
            </h2>
            <p className="font-display text-xl leading-snug font-bold sm:text-2xl">{t('tagline')}</p>
            <p className="type-body-lg text-fg-secondary max-w-[36rem]">{t('intro')}</p>
          </Reveal>

          <Reveal as="ul" className="grid gap-2 sm:grid-cols-2">
            {(['g1', 'g2', 'g3', 'g4'] as const).map((k) => (
              <li key={k} className="flex items-start gap-2 text-[0.9375rem]">
                <Check className={cn('mt-1 size-4 shrink-0', guide.text)} aria-hidden />
                {t(`goodAt.${k}`)}
              </li>
            ))}
          </Reveal>

          <Reveal className="flex flex-col gap-3">
            <span className="text-sm font-bold">{t('tryAsking')}</span>
            <ul className="flex flex-col gap-2">
              {(['s1', 's2', 's3'] as const).map((s) => (
                <li key={s}>
                  <GuideChatLink character={guide.id} className={cn('group focus-ring bg-surface flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-xs transition-colors', guide.ring)}>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-bold">{tc(`${guide.id}.suggestions.${s}.title`)}</span>
                      <span className="text-fg-secondary truncate text-xs">{tc(`${guide.id}.suggestions.${s}.prompt`)}</span>
                    </span>
                    <MessageCircle className={cn('size-4 shrink-0', guide.text)} aria-hidden />
                  </GuideChatLink>
                </li>
              ))}
            </ul>
            <p className="type-caption text-fg-muted">{t('promptsNote')}</p>
          </Reveal>

          <div className="flex flex-wrap items-center gap-3">
            <GuideChatLink character={guide.id} className="focus-ring bg-cta text-on-cta shadow-glow inline-flex h-12 items-center gap-2 rounded-full px-7 text-base font-medium transition-opacity hover:opacity-90">
              <MessageCircle className="size-4" aria-hidden />
              {t('cta')}
            </GuideChatLink>
            <span className="text-fg-secondary inline-flex items-center gap-2 text-xs">
              <Mic className="size-3.5" aria-hidden />
              <StatusTag status="simulated" />
              {t('voice')}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

function WhoToAsk() {
  const t = useTranslations('site.guides.compare');
  const tc = useTranslations('characters');
  const rows = [
    { key: 'history', pick: 'arif' },
    { key: 'food', pick: 'arif' },
    { key: 'expo', pick: 'roaya' },
    { key: 'family', pick: 'roaya' },
    { key: 'modern', pick: 'roaya' },
    { key: 'beyond', pick: 'arif' },
  ] as const;
  return (
    <Section labelledBy="compare-title" className="border-border border-t">
      <SectionHeading id="compare-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
      <div className="border-border bg-surface overflow-x-auto rounded-[1.5rem] border shadow-sm">
        <table className="w-full min-w-[32rem] text-start text-sm">
          <caption className="sr-only">{t('caption')}</caption>
          <thead className="bg-ivory border-border border-b">
            <tr>
              <th scope="col" className="px-5 py-4 text-start font-bold">
                {t('topic')}
              </th>
              {(['arif', 'roaya'] as const).map((id) => (
                <th key={id} scope="col" className={cn('px-5 py-4 text-center font-bold', id === 'arif' ? 'text-arif-fg' : 'text-roaya-fg')}>
                  {tc(`${id}.name`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="px-5 py-4 text-start font-medium">
                  {t(`rows.${row.key}`)}
                </th>
                {(['arif', 'roaya'] as const).map((id) => (
                  <td key={id} className="px-5 py-4 text-center">
                    {row.pick === id ? (
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', id === 'arif' ? 'bg-arif-tint text-arif-fg' : 'bg-roaya-tint text-roaya-fg')}>
                        <Check className="size-3.5" aria-hidden />
                        {t('bestMatch')}
                      </span>
                    ) : (
                      <span className="text-fg-muted text-xs">{t('canHelp')}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="type-caption text-fg-muted">{t('note')}</p>
    </Section>
  );
}
