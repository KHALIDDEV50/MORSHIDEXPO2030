'use client';

import { ArrowRight, Bell, CalendarClock, Check, Compass, ExternalLink, GripVertical, Languages, LocateFixed, Map as MapIcon, MessageCircle, Mic, Route, Shapes, Smartphone, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import { CharacterAvatar, type CharacterId } from '@/entities/ai-character';
import { EXPO_SITE, useBoothSearch, useExpoLayout } from '@/entities/expo';
import { CATEGORY_ICON, usePlaceSearch } from '@/entities/place';
import { localize } from '@/shared/api';
import { SITE_MEDIA, type SiteMediaKey } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { MapView, zoneColor, type LocalLayer, type MapViewMarker } from '@/shared/map';
import { Button, ErrorState, Reveal, Skeleton } from '@/shared/ui';
import {
  ArrowLink,
  ChapterNav,
  CtaBand,
  GuideChatLink,
  ItineraryDemo,
  MediaImage,
  PageHero,
  PhoneFrame,
  PlanScreenMock,
  Section,
  StatusLegend,
  StatusTag,
  type CapabilityStatus,
} from '@/widgets/public-site';

const CHAPTERS = ['chat', 'discover', 'expo', 'itineraries', 'plans', 'maps', 'languages', 'journey'] as const;

/**
 * Features (`/[locale]/features`): one chapter per capability, each with its own layout and a
 * small interactive demonstration, and an explicit status — works in the demo, simulated, or
 * planned. Every "try it" link opens the real product route.
 */
export function FeaturesPageView() {
  const t = useTranslations('site.features');
  const chapters = useMemo(() => CHAPTERS.map((id) => ({ id, label: t(`chapters.${id}`) })), [t]);
  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} titleLines={[t('hero.line1'), t('hero.line2')]} accentLine={1} intro={t('hero.intro')} media={SITE_MEDIA.faisaliah}>
        <StatusLegend className="motion-rise mt-4 max-w-3xl" />
      </PageHero>
      <ChapterNav label={t('chaptersLabel')} chapters={chapters} />
      <ChatChapter />
      <DiscoverChapter />
      <ExpoChapter />
      <ItinerariesChapter />
      <PlansChapter />
      <MapsChapter />
      <LanguagesChapter />
      <JourneyChapter />
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/chat', label: t('final.primary') }} secondary={{ href: '/how-it-works', label: t('final.secondary') }} media={SITE_MEDIA.kingdomCentre} />
    </>
  );
}

/** Chapter opening: number, title, status and body. */
function ChapterHead({ id, n, status, children }: { id: (typeof CHAPTERS)[number]; n: number; status: CapabilityStatus; children?: ReactNode }) {
  const t = useTranslations('site.features');
  return (
    <Reveal className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-accent-pink font-display text-5xl font-extrabold tabular-nums sm:text-6xl" dir="ltr" aria-hidden>
          {String(n).padStart(2, '0')}
        </span>
        <StatusTag status={status} />
      </div>
      <h2 id={`${id}-title`} className="type-statement [text-wrap:balance]">
        {t(`${id}.title`)}
      </h2>
      <p className="type-body-lg text-fg-secondary max-w-2xl">{t(`${id}.body`)}</p>
      {children}
    </Reveal>
  );
}

function TryLink({ href, children, variant = 'gradient' }: { href: string; children: ReactNode; variant?: 'gradient' | 'secondary' }) {
  return (
    <Button asChild variant={variant} className="group w-fit">
      <Link href={href}>
        {children}
        <ArrowRight className="nudge flip-rtl" aria-hidden />
      </Link>
    </Button>
  );
}

// 01 ───────────── Chat (simulated replies) ─────────────

function ChatChapter() {
  const t = useTranslations('site.features.chat');
  const tc = useTranslations('characters');
  const [character, setCharacter] = useState<CharacterId>('arif');
  const [asked, setAsked] = useState<'q1' | 'q2' | 'q3' | null>(null);

  return (
    <Section id="chat" labelledBy="chat-title" className="scroll-mt-36">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <ChapterHead id="chat" n={1} status="simulated">
          <p className="border-warning/40 bg-warning-tint text-warning-fg rounded-xl border px-4 py-3 text-sm">{t('honesty')}</p>
          <div className="flex flex-wrap gap-2">
            <GuideChatLink character={character} className="group focus-ring bg-cta text-on-cta shadow-glow inline-flex h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium">
              <MessageCircle className="size-4" aria-hidden />
              {t('cta', { name: tc(`${character}.name`) })}
            </GuideChatLink>
          </div>
        </ChapterHead>

        {/* Interactive sample: pick a companion and a question */}
        <Reveal variant="scale" className="bg-surface text-fg border-border flex flex-col gap-4 rounded-[1.75rem] border p-5 shadow-md sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div role="radiogroup" aria-label={t('pickCompanion')} className="bg-surface-muted flex gap-1 rounded-full p-1">
              {(['arif', 'roaya'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={character === id}
                  onClick={() => {
                    setCharacter(id);
                    setAsked(null);
                  }}
                  className={cn('focus-ring flex items-center gap-2 rounded-full py-1 ps-1 pe-3 text-sm font-bold transition-colors', character === id ? 'bg-surface shadow-sm' : 'text-fg-secondary')}
                >
                  <CharacterAvatar id={id} size="sm" decorative />
                  {tc(`${id}.name`)}
                </button>
              ))}
            </div>
            <span className="bg-sand text-fg-secondary rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold">{t('sampleLabel')}</span>
          </div>
          <div className="flex min-h-56 flex-col gap-3" aria-live="polite">
            {asked ? (
              <>
                <p key={`${character}-${asked}-q`} className="animate-pop-in bg-primary text-primary-fg max-w-[85%] self-end rounded-2xl rounded-ee-md px-4 py-2.5 text-sm">
                  {t(`samples.${character}.${asked}.q`)}
                </p>
                <div key={`${character}-${asked}-a`} className="animate-pop-in flex items-end gap-2.5">
                  <CharacterAvatar id={character} size="md" decorative />
                  <p className="bg-ivory border-border rounded-2xl rounded-es-md border px-4 py-2.5 text-sm">{t(`samples.${character}.${asked}.a`)}</p>
                </div>
              </>
            ) : (
              <p className="text-fg-secondary m-auto max-w-xs text-center text-sm">{t('pickQuestion')}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['q1', 'q2', 'q3'] as const).map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={asked === q}
                onClick={() => setAsked(q)}
                className={cn('focus-ring border-border rounded-full border px-3.5 py-2 text-start text-sm transition-colors', asked === q ? 'border-primary bg-primary-tint text-primary' : 'bg-surface hover:border-primary/50')}
              >
                {t(`samples.${character}.${q}.q`)}
              </button>
            ))}
          </div>
          <p className="text-fg-muted inline-flex items-center gap-1.5 text-xs">
            <Mic className="size-3.5" aria-hidden />
            {t('voiceNote')}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

// 02 ───────────── Discover (live) ─────────────

const MOSAIC: { media: SiteMediaKey; tags: ('heritage' | 'nature' | 'modern')[] }[] = [
  { media: 'masmak', tags: ['heritage'] },
  { media: 'edgeOfTheWorld', tags: ['nature'] },
  { media: 'kingdomCentre', tags: ['modern'] },
  { media: 'rijalAlmaa', tags: ['heritage'] },
  { media: 'alQarah', tags: ['nature', 'heritage'] },
  { media: 'kafd', tags: ['modern'] },
];

function DiscoverChapter() {
  const t = useTranslations('site.features.discover');
  const locale = useLocale();
  const [filter, setFilter] = useState<'all' | 'heritage' | 'nature' | 'modern'>('all');
  const places = usePlaceSearch({ locale, pageSize: 100 });
  const count = places.data?.total;

  return (
    <Section id="discover" labelledBy="discover-title" className="border-border scroll-mt-36 border-t">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <div role="group" aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
            {(['all', 'heritage', 'nature', 'modern'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn('focus-ring h-9 rounded-full px-4 text-sm font-bold transition-colors', filter === f ? 'bg-fg text-background' : 'bg-surface text-fg-secondary hover:text-fg border-border border')}
              >
                {t(`filters.${f}`)}
              </button>
            ))}
          </div>
          <ul className="grid min-h-[20rem] grid-cols-2 content-start gap-3 sm:grid-cols-3">
            {MOSAIC.filter((m) => filter === 'all' || m.tags.includes(filter)).map((m) => (
              <li key={`${filter}-${m.media}`} className="animate-pop-in">
                <MediaImage media={SITE_MEDIA[m.media]} sizes="(min-width: 640px) 22vw, 45vw" className="aspect-[4/3] rounded-2xl" />
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2">
          <ChapterHead id="discover" n={2} status="live">
            <ul className="text-fg-secondary flex flex-col gap-2 text-[0.9375rem]">
              {(['b1', 'b2', 'b3'] as const).map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className="text-success-fg mt-1 size-4 shrink-0" aria-hidden />
                  {t(`bullets.${b}`)}
                </li>
              ))}
            </ul>
            {typeof count === 'number' && <p className="type-caption text-fg-muted">{t('count', { count })}</p>}
            <TryLink href="/discover">{t('cta')}</TryLink>
          </ChapterHead>
        </div>
      </div>
    </Section>
  );
}

// 03 ───────────── Expo 2030 map (illustrative) ─────────────

function ExpoChapter() {
  const t = useTranslations('site.features.expo');
  const locale = useLocale();
  const layout = useExpoLayout();
  const booths = useBoothSearch({});
  const localLayer = useMemo<LocalLayer | undefined>(
    () =>
      layout.data && {
        extent: EXPO_SITE,
        site: layout.data.site,
        paths: layout.data.paths,
        zones: layout.data.zones.map((z) => ({ id: z.id, number: z.number, name: localize(z.name, locale), color: z.color, polygon: z.polygon, labelAt: z.labelAt })),
      },
    [layout.data, locale],
  );
  const zoneById = new Map((layout.data?.zones ?? []).map((z) => [z.id, z]));
  const markers: MapViewMarker[] = (booths.data ?? []).map((b) => ({
    id: b.id,
    position: b.position,
    code: b.number,
    color: zoneById.get(b.zoneId) ? zoneColor(zoneById.get(b.zoneId)!.color) : undefined,
    label: localize(b.name, locale),
    kind: 'place',
  }));

  return (
    <Section id="expo" labelledBy="expo-title" className="border-border scroll-mt-36 border-t">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <ChapterHead id="expo" n={3} status="simulated">
          <p className="border-warning/40 bg-warning-tint text-warning-fg rounded-xl border px-4 py-3 text-sm">{t('disclaimer')}</p>
          <div className="flex flex-wrap gap-2">
            <TryLink href="/expo">{t('cta')}</TryLink>
            <TryLink href="/chat?view=expo" variant="secondary">
              {t('ctaChat')}
            </TryLink>
          </div>
        </ChapterHead>
        <Reveal variant="scale" className="border-border bg-surface h-[22rem] overflow-hidden rounded-[1.75rem] border shadow-lg sm:h-[28rem]">
          {localLayer ? (
            <MapView mode="local" label={t('mapLabel')} localLayer={localLayer} markers={markers} fitToMarkers={false} className="size-full" />
          ) : layout.isError ? (
            <ErrorState error={layout.error} onRetry={() => void layout.refetch()} className="size-full" />
          ) : (
            <Skeleton className="size-full rounded-none" />
          )}
        </Reveal>
      </div>
    </Section>
  );
}

// 04 ───────────── Itineraries (live, replies simulated) ─────────────

function ItinerariesChapter() {
  const t = useTranslations('site.features.itineraries');
  return (
    <Section id="itineraries" labelledBy="itineraries-title" className="border-border scroll-mt-36 border-t">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ItineraryDemo />
        <ChapterHead id="itineraries" n={4} status="live">
          <ol className="flex flex-col gap-3">
            {(['s1', 's2', 's3'] as const).map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="bg-cta text-on-cta grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold">{i + 1}</span>
                <span className="text-fg-secondary text-[0.9375rem]">{t(`steps.${s}`)}</span>
              </li>
            ))}
          </ol>
          <p className="type-caption text-fg-muted">{t('note')}</p>
          <TryLink href="/chat">{t('cta')}</TryLink>
        </ChapterHead>
      </div>
    </Section>
  );
}

// 05 ───────────── Plans (live) ─────────────

function PlansChapter() {
  const t = useTranslations('site.features.plans');
  const tools = [
    { key: 'edit', icon: <CalendarClock /> },
    { key: 'reorder', icon: <GripVertical /> },
    { key: 'guided', icon: <Route /> },
    { key: 'done', icon: <Check /> },
  ] as const;
  return (
    <Section id="plans" labelledBy="plans-title" className="border-border scroll-mt-36 border-t">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <ChapterHead id="plans" n={5} status="live">
          <ul className="grid gap-3 sm:grid-cols-2">
            {tools.map((tool, i) => (
              <Reveal as="li" key={tool.key} delay={i * 80} className="bg-surface border-border flex gap-3 rounded-2xl border p-4">
                <span className="text-primary [&_svg]:size-5" aria-hidden>
                  {tool.icon}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{t(`tools.${tool.key}.title`)}</span>
                  <span className="text-fg-secondary text-sm">{t(`tools.${tool.key}.body`)}</span>
                </span>
              </Reveal>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <TryLink href="/plans">{t('cta')}</TryLink>
            <TryLink href="/plans/new" variant="secondary">
              {t('ctaNew')}
            </TryLink>
          </div>
        </ChapterHead>
        <Reveal variant="scale" className="flex justify-center">
          <PhoneFrame label={t('mockLabel')} className="w-[16rem] rotate-2 rtl:-rotate-2">
            <PlanScreenMock />
          </PhoneFrame>
        </Reveal>
      </div>
    </Section>
  );
}

// 06 ───────────── Interactive maps (live) ─────────────

function MapsChapter() {
  const t = useTranslations('site.features.maps');
  const td = useTranslations('site.destinations');
  const locale = useLocale();
  const places = usePlaceSearch({ locale, pageSize: 100 });
  const [selected, setSelected] = useState<string | null>(null);
  const markers = useMemo<MapViewMarker[]>(
    () => (places.data?.items ?? []).map((p) => ({ id: p.id, position: p.location, label: localize(p.name, locale), kind: 'place', icon: CATEGORY_ICON[p.categories[0]!] })),
    [places.data, locale],
  );
  const place = places.data?.items.find((p) => p.id === selected);

  return (
    <Section id="maps" labelledBy="maps-title" className="border-border scroll-mt-36 border-t">
      <ChapterHead id="maps" n={6} status="live" />
      <Reveal variant="clip" className="border-border bg-surface relative h-[26rem] overflow-hidden rounded-[1.75rem] border shadow-lg sm:h-[32rem]">
        {markers.length > 0 ? (
          <MapView mode="geo" label={t('mapLabel')} markers={markers} selectedId={selected} onSelect={setSelected} className="size-full" />
        ) : places.isError ? (
          <ErrorState error={places.error} onRetry={() => void places.refetch()} className="size-full" />
        ) : places.isPending ? (
          <Skeleton className="size-full rounded-none" />
        ) : (
          <p className="text-fg-secondary grid size-full place-items-center p-6 text-center text-sm">{td('empty')}</p>
        )}
        <div className="glass border-border absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 sm:inset-x-auto sm:end-4 sm:bottom-4 sm:max-w-sm">
          {place ? (
            <>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold">{localize(place.name, locale)}</span>
                <span className="text-fg-secondary line-clamp-1 text-xs">{localize(place.summary, locale)}</span>
              </span>
              <Button asChild size="sm">
                <Link href={`/discover/${place.id}`}>{t('open')}</Link>
              </Button>
            </>
          ) : (
            <span className="text-fg-secondary text-sm">{t('hint')}</span>
          )}
        </div>
      </Reveal>
      <div className="flex flex-wrap gap-2">
        <TryLink href="/discover?view=map">{t('cta')}</TryLink>
        <TryLink href="/chat?view=map" variant="secondary">
          {t('ctaChat')}
        </TryLink>
      </div>
    </Section>
  );
}

// 07 ───────────── Arabic & English (live) ─────────────

function LanguagesChapter() {
  const t = useTranslations('site.features.languages');
  return (
    <Section id="languages" labelledBy="languages-title" className="border-border scroll-mt-36 border-t">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ChapterHead id="languages" n={7} status="live">
          <p className="text-fg-secondary inline-flex items-start gap-2 text-sm">
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('more')}
          </p>
        </ChapterHead>
        {/* The same card, composed for each script — not a mirror image */}
        <Reveal className="grid gap-4 sm:grid-cols-2">
          <BilingualCard lang="ar" />
          <BilingualCard lang="en" className="sm:mt-12" />
        </Reveal>
      </div>
    </Section>
  );
}

/** Fixed copy in both languages on purpose: it demonstrates the two scripts side by side. */
const BILINGUAL = {
  ar: { dir: 'rtl', label: 'العربية', name: 'قصر المصمك', area: 'الديرة · الرياض', line: 'الحصن الطيني الذي بدأت منه قصة الرياض الحديثة.' },
  en: { dir: 'ltr', label: 'English', name: 'Masmak Fortress', area: 'Al-Dirah · Riyadh', line: 'The clay fort where the story of modern Riyadh began.' },
} as const;

function BilingualCard({ lang, className }: { lang: 'ar' | 'en'; className?: string }) {
  const c = BILINGUAL[lang];
  return (
    <div lang={lang} dir={c.dir} className={cn('bg-surface border-border overflow-hidden rounded-[1.5rem] border shadow-md', className)}>
      <MediaImage media={SITE_MEDIA.masmak} sizes="(min-width: 640px) 25vw, 90vw" credit="none" className="aspect-[4/3]" />
      <div className="flex flex-col gap-1 p-4">
        <span className="text-primary text-xs font-bold">{c.label}</span>
        <span className="font-display text-lg font-bold">{c.name}</span>
        <span className="text-fg-muted text-xs">{c.area}</span>
        <span className="text-fg-secondary text-sm">{c.line}</span>
      </div>
    </div>
  );
}

// 08 ───────────── Before, during and after ─────────────

type JourneyKey = 'journal' | 'plan' | 'expoPreview' | 'guided' | 'locate' | 'directions' | 'voice' | 'keep' | 'notifications' | 'app';

const JOURNEY: { phase: 'before' | 'during' | 'after'; items: { key: JourneyKey; status: CapabilityStatus; icon: ReactNode; href?: string }[] }[] = [
  {
    phase: 'before',
    items: [
      { key: 'journal', status: 'live', icon: <Sparkles />, href: '/blog' },
      { key: 'plan', status: 'live', icon: <Compass />, href: '/plans/new' },
      { key: 'expoPreview', status: 'simulated', icon: <Shapes />, href: '/expo' },
    ],
  },
  {
    phase: 'during',
    items: [
      { key: 'guided', status: 'live', icon: <Route />, href: '/plans' },
      { key: 'locate', status: 'live', icon: <LocateFixed /> },
      { key: 'directions', status: 'live', icon: <ExternalLink /> },
      { key: 'voice', status: 'simulated', icon: <Mic /> },
    ],
  },
  {
    phase: 'after',
    items: [
      { key: 'keep', status: 'live', icon: <MapIcon />, href: '/plans' },
      { key: 'notifications', status: 'simulated', icon: <Bell />, href: '/notifications' },
      { key: 'app', status: 'planned', icon: <Smartphone />, href: '/mobile-app' },
    ],
  },
];

function JourneyChapter() {
  const t = useTranslations('site.features.journey');
  return (
    <Section id="journey" labelledBy="journey-title" className="border-border scroll-mt-36 border-t">
      <ChapterHead id="journey" n={8} status="live" />
      <ol className="grid gap-6 lg:grid-cols-3">
        {JOURNEY.map((col, i) => (
          <Reveal as="li" key={col.phase} delay={i * 120} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-border-strong h-px flex-1" aria-hidden />
              <h3 className="font-display text-2xl font-extrabold">{t(`phases.${col.phase}`)}</h3>
              <span className="bg-border-strong h-px flex-1" aria-hidden />
            </div>
            <ul className="flex flex-col gap-3">
              {col.items.map((item) => {
                const body = (
                  <>
                    <span className="bg-primary-tint text-primary grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-4.5" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{t(`items.${item.key}.title`)}</span>
                        <StatusTag status={item.status} />
                      </span>
                      <span className="text-fg-secondary text-sm">{t(`items.${item.key}.body`)}</span>
                    </span>
                  </>
                );
                return (
                  <li key={item.key}>
                    {item.href ? (
                      <Link href={item.href} className="focus-ring hover-lift bg-surface border-border flex gap-3 rounded-2xl border p-4">
                        {body}
                      </Link>
                    ) : (
                      <div className="bg-surface border-border flex gap-3 rounded-2xl border p-4">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        ))}
      </ol>
      <div className="border-border bg-surface flex flex-col gap-3 rounded-[1.5rem] border p-6">
        <h3 className="type-h3">{t('plannedTitle')}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(['ai', 'accounts', 'push', 'expoData'] as const).map((k) => (
            <li key={k} className="text-fg-secondary flex items-start gap-2 text-sm">
              <StatusTag status="planned" />
              <span>{t(`planned.${k}`)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ArrowLink href="/mobile-app">{t('appLink')}</ArrowLink>
    </Section>
  );
}

