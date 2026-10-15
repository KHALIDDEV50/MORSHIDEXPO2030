'use client';

import { Check, Clock, Cpu, Info, Leaf, MapPin, MessageCircle, Palette, PartyPopper, Route, SearchX } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { BoothPhoto, EXPO_BOOTH_CATEGORIES, useBoothSearch, useExpoLayout, type ExpoBoothCategory } from '@/entities/expo';
import { AddToPlanButton } from '@/features/add-to-plan';
import { localize } from '@/shared/api';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { zoneColor } from '@/shared/map';
import { Badge, Button, CardSkeleton, DemoBadge, EmptyState, ErrorState, SearchField, Skeleton } from '@/shared/ui';
import { ChatDock, ChatLauncher, type DockPrompt } from '@/widgets/chat-thread';
import { ExpoSiteMap } from '@/widgets/expo-site-map';

export function ExpoPageView() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[80dvh] rounded-xl" />}>
      <ExpoPage />
    </Suspense>
  );
}

/**
 * Expo 2030 Riyadh (PRD §4.3, P-023): the site map is the main experience — a compact header,
 * then the interactive map across most of the viewport; the Expo assistant and the pavilion
 * directory follow below. Always labelled as an illustrative demo layout, never the official
 * venue (D-023).
 */
function ExpoPage() {
  const t = useTranslations('expoPage');
  const search = useSearchParams();
  const focus = search.get('focus') ?? undefined;
  // `?zone=<id>` opens the map on one district (links from the home page); unknown ids show the whole site
  const zone = search.get('zone') ?? undefined;

  return (
    <div className="bg-page flex-1">
      <section aria-labelledby="expo-title" className="flex flex-col gap-3 px-3 pt-3 sm:px-4 lg:px-5 lg:pt-4">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 id="expo-title" className="type-h1">
              {t('title')}
            </h1>
            <p className="text-fg-secondary max-w-2xl text-sm">{t('subtitle')}</p>
          </div>
          {/* Permanent, visible disclaimer (PRD §4.3 acceptance) */}
          <p role="note" className="border-warning/40 bg-warning-tint text-warning-fg flex max-w-xl items-start gap-2 rounded-lg border px-3 py-1.5 text-xs">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t('disclaimer')}
          </p>
        </header>
        <h2 className="sr-only">{t('mapTitle')}</h2>
        <ExpoSiteMap key={`${focus ?? ''}|${zone ?? ''}`} initialBoothId={focus} initialZoneId={zone} className="h-[calc(100dvh-15rem)] min-h-[30rem] md:h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-10.5rem)]" />
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 pb-28 sm:px-6">
        <ExpoAssistant />
        <PavilionDirectory />
      </div>
    </div>
  );
}

type Topic = { key: string; icon: ReactNode; text: string };

/**
 * Expo assistant (PRD §4.1/§4.3): the same chat popup as the rest of MORSHID, with the Expo as
 * context. Visitors pick an interest or ask about zones and pavilions; a visit plan comes back as
 * a proposal they review and explicitly save to My Plans. Demo replies from the illustrative
 * layout only — labelled in the section and in every reply.
 */
function ExpoAssistant() {
  const t = useTranslations('expoPage.assistant');
  const tc = useTranslations('characters');
  const [character] = useActiveCharacter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<DockPrompt | null>(null);
  const name = tc(`${character}.name`);

  const topics: Topic[] = [
    { key: 'tech', icon: <Cpu />, text: t('topics.tech') },
    { key: 'culture', icon: <Palette />, text: t('topics.culture') },
    { key: 'green', icon: <Leaf />, text: t('topics.green') },
    { key: 'shows', icon: <PartyPopper />, text: t('topics.shows') },
    { key: 'stage', icon: <MapPin />, text: t('topics.stage') },
  ];
  const ask = (text: string) => {
    setPrompt({ id: Date.now(), text });
    setOpen(true);
  };

  return (
    <section aria-labelledby="expo-assistant-title" className="border-primary/20 bg-surface-brand relative overflow-hidden rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <CharacterAvatar id={character} size="lg" decorative className="shrink-0" />
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id="expo-assistant-title" className="type-h3">
                {t('title', { name })}
              </h2>
              <DemoBadge label={t('demo')} className="w-fit" />
            </div>
          </div>
          <p className="type-body text-fg-secondary">{t('body', { name })}</p>
          <ol className="type-body-sm text-fg-secondary flex flex-col gap-1 font-normal sm:flex-row sm:flex-wrap sm:gap-x-5">
            {(['step1', 'step2', 'step3'] as const).map((step, i) => (
              <li key={step} className="inline-flex items-center gap-2">
                <span className="bg-cta text-on-cta grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold tabular-nums">{i + 1}</span>
                {t(step)}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" onClick={() => ask(t('planPrompt'))}>
              <Route aria-hidden />
              {t('plan')}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <MessageCircle aria-hidden />
              {t('start', { name })}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:w-80">
          <p className="text-sm font-bold">{t('interestsLabel')}</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {topics.map((topic) => (
              <li key={topic.key}>
                <button
                  type="button"
                  onClick={() => ask(topic.text)}
                  className="focus-ring border-border bg-surface hover:border-primary/40 hover:bg-surface-muted inline-flex w-full cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-start text-sm font-medium transition-colors lg:rounded-xl [&_svg]:size-4"
                >
                  <span className="text-primary shrink-0" aria-hidden>
                    {topic.icon}
                  </span>
                  {topic.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ChatDock
        open={open}
        onClose={() => setOpen(false)}
        context={{ kind: 'expo' }}
        label={t('dockLabel')}
        contextLabel={t('dockContext')}
        intro={t('intro', { name })}
        suggestions={topics.slice(0, 4).concat({ key: 'plan', icon: <Route />, text: t('planPrompt') })}
        prompt={prompt}
      />
      <ChatLauncher label={t('dockLabel')} onOpen={() => setOpen(true)} hidden={open} />
    </section>
  );
}

function PavilionDirectory() {
  const t = useTranslations('expoPage');
  const te = useTranslations('expoMap');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<ExpoBoothCategory[]>([]);
  const booths = useBoothSearch({ q: q || undefined });
  const layout = useExpoLayout();
  const zones = useMemo(() => new Map((layout.data?.zones ?? []).map((z) => [z.id, z])), [layout.data]);
  const results = (booths.data ?? []).filter((b) => categories.length === 0 || categories.includes(b.category)).sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }));
  const toggle = (c: ExpoBoothCategory) => setCategories((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  return (
    <section aria-labelledby="pavilions-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pavilions-title" className="type-h2">
          {t('pavilionsTitle')}
        </h2>
        <DemoBadge label={te('demoData')} />
      </div>
      <SearchField label={t('search')} placeholder={t('search')} value={q} onValueChange={setQ} />
      <ul className="flex flex-wrap gap-2" aria-label={t('categoriesLabel')}>
        {EXPO_BOOTH_CATEGORIES.map((c) => {
          const on = categories.includes(c);
          return (
            <li key={c}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c)}
                className={cn(
                  'focus-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                  on ? 'bg-fg text-background border-transparent' : 'border-border bg-surface text-fg-secondary hover:border-border-strong hover:text-fg',
                )}
              >
                {on && <Check className="size-3.5" aria-hidden />}
                {te(`category.${c}`)}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="type-body-sm text-fg-secondary font-normal" aria-live="polite">
        {t('count', { count: results.length })}
      </p>

      {booths.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : booths.isError ? (
        <ErrorState error={booths.error} onRetry={() => void booths.refetch()} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={t('empty')}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQ('');
                setCategories([]);
              }}
            >
              {t('clear')}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => {
            const zone = zones.get(b.zoneId);
            return (
              <li key={b.id}>
                <article className="border-border bg-surface relative flex h-full flex-col gap-2 overflow-hidden rounded-xl border p-4 pt-0">
                  <BoothPhoto booth={b} className="-mx-4 mb-2 aspect-[16/9]" />
                  <div className="flex items-start gap-2.5">
                    <span
                      dir="ltr"
                      style={{ borderColor: zone ? zoneColor(zone.color) : undefined }}
                      className="grid h-8 min-w-8 shrink-0 place-items-center rounded-full border-2 px-1 text-xs font-bold tabular-nums"
                    >
                      {b.number}
                    </span>
                    <h3 className="text-base font-bold">
                      <Link href={`/expo/${b.id}`} className="focus-ring rounded-sm after:absolute after:inset-0 after:content-['']">
                        {localize(b.name, locale)}
                      </Link>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="neutral">{te(`category.${b.category}`)}</Badge>
                  </div>
                  <p className="type-body-sm text-fg-secondary flex-1 font-normal">{localize(b.summary, locale)}</p>
                  <ul className="type-caption text-fg-muted flex flex-wrap gap-x-3">
                    {zone && (
                      <li className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {te('zoneShort', { number: zone.number, name: localize(zone.name, locale) })}
                      </li>
                    )}
                    <li className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden />
                      {formatDuration(b.suggestedDurationMin)}
                    </li>
                  </ul>
                  <div className="relative z-10">
                    <AddToPlanButton booth={b} variant="secondary" />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
