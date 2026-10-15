'use client';

import { Check, Clock, Compass, Map as MapIcon, MapPin, MessageCircle, Mic, Route, Search, SendHorizontal, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';
import { CharacterAvatar } from '@/entities/ai-character';
import { localize } from '@/shared/api';
import { SITE_MEDIA, type SiteMedia } from '@/shared/content';
import { cn } from '@/shared/lib';

/*
 * Stylised product previews built from the real design tokens and character art — not
 * screenshots. Their text is sample content (`site.mockups.*`) and every frame is labelled
 * "Sample screen" for assistive technology; the visual chip is shown by the caller.
 */

/** Phone bezel (warm charcoal) around a light screen in the public-site palette. */
export function PhoneFrame({ children, className, label, style }: { children: ReactNode; className?: string; label: string; style?: CSSProperties }) {
  return (
    <figure aria-label={label} className={cn('relative aspect-[9/19] w-full max-w-[17.5rem] shrink-0', className)} style={style}>
      <div className="bg-ink absolute inset-0 rounded-[2.6rem] p-[0.5rem] shadow-[0_36px_64px_-28px_rgb(60_48_30/0.55),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <div className="bg-chat text-fg relative flex size-full flex-col overflow-hidden rounded-[2.1rem]">
          <div aria-hidden className="bg-ink absolute start-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full rtl:translate-x-1/2" />
          <div className="flex flex-1 flex-col overflow-hidden pt-9" aria-hidden>
            {children}
          </div>
        </div>
      </div>
    </figure>
  );
}

function ScreenHeader({ title, icon, accent }: { title: string; icon: ReactNode; accent?: ReactNode }) {
  return (
    <div className="border-border flex items-center gap-2 border-b px-3.5 pb-2.5">
      {icon}
      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-bold">{title}</span>
      {accent}
    </div>
  );
}

/** Chat with Arif: a question, an answer and an itinerary proposal. */
export function ChatScreenMock({ animate = false }: { animate?: boolean }) {
  const t = useTranslations('site.mockups.chat');
  const tc = useTranslations('characters');
  const rise = (i: number) => (animate ? { className: 'motion-rise', style: { '--delay': `${300 + i * 420}ms` } as CSSProperties } : {});
  return (
    <>
      <ScreenHeader title={tc('arif.name')} icon={<CharacterAvatar id="arif" size="sm" decorative />} accent={<span className="bg-arif-tint text-arif-fg rounded-full px-2 py-0.5 text-[0.625rem] font-bold">{t('online')}</span>} />
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3 pt-3 text-[0.75rem] leading-snug">
        <p {...rise(0)} className={cn('bg-primary text-primary-fg max-w-[85%] self-end rounded-2xl rounded-ee-md px-3 py-2', rise(0).className)}>
          {t('question')}
        </p>
        <p {...rise(1)} className={cn('bg-surface border-border max-w-[88%] self-start rounded-2xl rounded-es-md border px-3 py-2', rise(1).className)}>
          {t('answer')}
        </p>
        <div {...rise(2)} className={cn('border-primary/30 bg-surface flex flex-col gap-1.5 rounded-xl border p-2.5', rise(2).className)}>
          <span className="text-primary inline-flex items-center gap-1 text-[0.625rem] font-bold">
            <Sparkles className="size-3" />
            {t('proposal')}
          </span>
          {(['s1', 's2', 's3'] as const).map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="bg-cta text-on-cta grid size-4.5 shrink-0 place-items-center rounded-full text-[0.5625rem] font-bold">{i + 1}</span>
              <span className="truncate">{t(`stops.${s}`)}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 p-2.5">
        <span className="bg-surface border-border text-fg-muted flex h-8 flex-1 items-center rounded-full border px-3 text-[0.6875rem]">{t('placeholder')}</span>
        <span className="bg-surface-muted grid size-8 place-items-center rounded-full">
          <Mic className="size-3.5" />
        </span>
        <span className="bg-cta text-on-cta grid size-8 place-items-center rounded-full">
          <SendHorizontal className="flip-rtl size-3.5" />
        </span>
      </div>
    </>
  );
}

function MiniCard({ media, name, meta }: { media: SiteMedia; name: string; meta: string }) {
  const locale = useLocale();
  return (
    <div className="bg-surface border-border overflow-hidden rounded-xl border">
      <div className="relative h-20">
        <Image src={media.src} alt={localize(media.alt, locale)} fill sizes="12rem" className="object-cover" />
      </div>
      <div className="flex flex-col px-2.5 py-2">
        <span className="truncate text-[0.75rem] font-bold">{name}</span>
        <span className="text-fg-muted inline-flex items-center gap-1 text-[0.625rem]">
          <MapPin className="size-2.5" />
          {meta}
        </span>
      </div>
    </div>
  );
}

/** Discover: search, categories and destination cards (real licensed photos). */
export function DiscoverScreenMock() {
  const t = useTranslations('site.mockups.discover');
  return (
    <>
      <ScreenHeader title={t('title')} icon={<Compass className="text-primary size-4" />} />
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3 pt-3">
        <span className="bg-surface border-border text-fg-muted flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.6875rem]">
          <Search className="size-3" />
          {t('search')}
        </span>
        <div className="flex gap-1.5">
          {(['heritage', 'nature', 'culture'] as const).map((c, i) => (
            <span key={c} className={cn('rounded-full px-2.5 py-1 text-[0.625rem] font-bold', i === 0 ? 'bg-primary text-primary-fg' : 'bg-surface-muted text-fg-secondary')}>
              {t(`chips.${c}`)}
            </span>
          ))}
        </div>
        <MiniCard media={SITE_MEDIA.masmak} name={t('card1')} meta={t('card1Meta')} />
        <MiniCard media={SITE_MEDIA.turaif} name={t('card2')} meta={t('card2Meta')} />
      </div>
    </>
  );
}

/** A saved plan: timeline of stops, one marked done by the visitor. */
export function PlanScreenMock() {
  const t = useTranslations('site.mockups.plan');
  const stops = [
    { key: 's1', time: '08:30', done: true },
    { key: 's2', time: '10:00', done: false },
    { key: 's3', time: '12:00', done: false },
    { key: 's4', time: '16:30', done: false },
  ] as const;
  return (
    <>
      <ScreenHeader title={t('title')} icon={<Route className="text-primary size-4" />} accent={<span className="text-fg-muted text-[0.625rem]">{t('meta')}</span>} />
      <div className="flex flex-1 flex-col gap-1 overflow-hidden px-3 pt-3">
        <div className="bg-surface-muted mb-2 h-1.5 overflow-hidden rounded-full">
          <div className="bg-brand-gradient h-full w-1/4 rounded-full" />
        </div>
        <ol className="flex flex-col">
          {stops.map((s, i) => (
            <li key={s.key} className="relative flex gap-2.5 pb-3">
              {i < stops.length - 1 && <span className="bg-border absolute start-[0.6875rem] top-6 bottom-0 w-px" />}
              <span className={cn('grid size-5.5 shrink-0 place-items-center rounded-full text-[0.625rem] font-bold', s.done ? 'bg-success text-white' : 'bg-cta text-on-cta')}>{s.done ? <Check className="size-3" /> : i + 1}</span>
              <span className="bg-surface border-border flex min-w-0 flex-1 flex-col rounded-lg border px-2.5 py-1.5">
                <span className={cn('truncate text-[0.75rem] font-bold', s.done && 'text-fg-muted line-through')}>{t(`stops.${s.key}`)}</span>
                <span className="text-fg-muted inline-flex items-center gap-1 text-[0.625rem]">
                  <Clock className="size-2.5" />
                  <span dir="ltr">{s.time}</span>
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex justify-around border-border border-t p-2.5 text-[0.5625rem]">
        {[<MessageCircle key="c" />, <Compass key="d" />, <MapIcon key="m" />, <Route key="p" />].map((icon, i) => (
          <span key={i} className={cn('grid size-7 place-items-center rounded-full [&_svg]:size-3.5', i === 3 ? 'bg-primary-tint text-primary' : 'text-fg-muted')}>
            {icon}
          </span>
        ))}
      </div>
    </>
  );
}
