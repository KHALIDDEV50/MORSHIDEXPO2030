'use client';

import { Check, Clock, RotateCcw, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type CSSProperties } from 'react';
import { CharacterAvatar } from '@/entities/ai-character';
import { localize } from '@/shared/api';
import { SITE_MEDIA } from '@/shared/content';
import { cn } from '@/shared/lib';
import { useInView, useMotionAllowed } from '@/shared/lib/use-motion';

/** Stage timings (ms after the previous stage): prompt → thinking → suggestions → plan */
const STEPS = [500, 1300, 1500, 1700];
/**
 * Two samples: old Riyadh with Arif, and an Expo morning with Roaya (illustrative pavilions from
 * the demo Expo layout; the thumbnails are the districts' concept renderings, not the pavilions).
 */
const VARIANTS = {
  riyadh: {
    character: 'arif',
    stops: [
      { key: 's1', media: SITE_MEDIA.masmak, time: '08:30' },
      { key: 's2', media: SITE_MEDIA.murabba, time: '10:00' },
      { key: 's3', media: SITE_MEDIA.nationalMuseum, time: '11:15' },
    ],
  },
  expo: {
    character: 'roaya',
    stops: [
      { key: 's1', media: SITE_MEDIA.expoTowerInterior, time: '10:00' },
      { key: 's2', media: SITE_MEDIA.expoConePavilions, time: '11:15' },
      { key: 's3', media: SITE_MEDIA.expoTowerGarden, time: '12:15' },
    ],
  },
} as const;

/**
 * "From a vague idea to a plan", played as a short sequence when it scrolls into view: the
 * visitor's words, the companion thinking, suggestions, then the stops dropping into a timeline.
 * Everything is always in the DOM (only opacity/position animate); reduced motion shows the
 * finished plan. The content is a labelled sample.
 */
export function ItineraryDemo({ onStage, variant = 'riyadh' }: { onStage?: (stage: number) => void; variant?: keyof typeof VARIANTS }) {
  const ts = useTranslations('site.itineraryDemo');
  const tv = useTranslations('site.itineraryDemo.expo');
  // Shared labels come from the base namespace; the conversation and stops from the variant's
  const t = (key: string) => (variant === 'expo' && /^(prompt|thinking|answer|stops\.|durations\.)/.test(key) ? tv(key as Parameters<typeof tv>[0]) : ts(key as Parameters<typeof ts>[0]));
  const { character, stops: STOPS } = VARIANTS[variant];
  const locale = useLocale();
  const motion = useMotionAllowed();
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -25% 0px' });
  const [animStage, setAnimStage] = useState(0);
  const [run, setRun] = useState(0);
  const stage = motion ? animStage : 4;

  useEffect(() => {
    if (!motion || !inView) return;
    const timers: number[] = [];
    let at = 0;
    STEPS.forEach((ms, i) => {
      at += ms;
      timers.push(window.setTimeout(() => setAnimStage(i + 1), at));
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [motion, inView, run]);

  useEffect(() => onStage?.(stage), [stage, onStage]);

  const show = (from: number) => (stage >= from ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3');

  return (
    <div ref={ref} className="bg-surface text-fg border-border relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border p-4 shadow-md sm:p-6">
      <div className="relative flex items-center justify-between gap-2">
        <span className="bg-sand text-fg-secondary rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold">{t('sample')}</span>
        {motion && (
          <button
            type="button"
            onClick={() => {
              setAnimStage(0);
              setRun((r) => r + 1);
            }}
            className="focus-ring text-fg-secondary hover:text-fg inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t('replay')}
          </button>
        )}
      </div>

      {/* 1 — the idea */}
      <p className={cn('bg-primary text-primary-fg relative max-w-[85%] self-end rounded-2xl rounded-ee-md px-4 py-2.5 text-sm transition-all duration-700', show(1))}>{t('prompt')}</p>

      {/* 2 — thinking, 3 — suggestions */}
      <div className="relative flex items-start gap-2.5">
        <CharacterAvatar id={character} size="md" decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className={cn('text-fg-muted inline-flex h-5 items-center gap-1 text-xs transition-opacity duration-500', stage === 2 ? 'opacity-100' : 'opacity-0')} aria-hidden={stage !== 2}>
            {t('thinking')}
            {[0, 1, 2].map((d) => (
              <span key={d} className="motion-drift bg-fg-muted size-1 rounded-full" style={{ '--delay': `${d * 150}ms` } as CSSProperties} />
            ))}
          </span>
          <p className={cn('bg-ivory border-border w-fit max-w-full rounded-2xl rounded-es-md border px-4 py-2.5 text-sm transition-all duration-700', show(3))}>{t('answer')}</p>
          <ul className="flex flex-wrap gap-2">
            {STOPS.map((s, i) => (
              <li key={s.key} className={cn('bg-ivory border-border flex items-center gap-2 rounded-full border py-1 ps-1 pe-3 text-xs font-bold transition-all duration-500', show(3))} style={{ transitionDelay: stage >= 3 ? `${i * 120}ms` : '0ms' }}>
                <span className="relative size-6 overflow-hidden rounded-full">
                  <Image src={s.media.src} alt="" fill sizes="1.5rem" className="object-cover" />
                </span>
                {t(`stops.${s.key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4 — the plan */}
      <div className={cn('border-primary/25 bg-ivory relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-700', show(4))}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-primary inline-flex items-center gap-1.5 text-xs font-bold">
            <Sparkles className="size-3.5" aria-hidden />
            {t('planTitle')}
          </span>
          <span className="text-fg-muted text-[0.6875rem]">{t('planMeta')}</span>
        </div>
        <ol className="relative flex flex-col gap-2.5">
          <span aria-hidden className="bg-border absolute start-[1.1875rem] top-4 bottom-4 w-px" />
          {STOPS.map((s, i) => (
            <li key={s.key} className={cn('relative flex items-center gap-3 transition-all duration-500', stage >= 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 rtl:translate-x-3')} style={{ transitionDelay: stage >= 4 ? `${200 + i * 160}ms` : '0ms' }}>
              <span className="bg-cta text-on-cta relative z-[1] grid size-[2.375rem] shrink-0 place-items-center rounded-full text-sm font-bold">{i + 1}</span>
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                <Image src={s.media.src} alt={localize(s.media.alt, locale)} fill sizes="2.75rem" className="object-cover" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold">{t(`stops.${s.key}`)}</span>
                <span className="text-fg-muted inline-flex items-center gap-1 text-xs">
                  <Clock className="size-3" aria-hidden />
                  <span dir="ltr">{s.time}</span> · {t(`durations.${s.key}`)}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-success-fg inline-flex items-center gap-1.5 text-xs font-bold">
          <Check className="size-3.5" aria-hidden />
          {t('review')}
        </p>
      </div>
    </div>
  );
}
