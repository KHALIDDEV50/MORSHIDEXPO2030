'use client';

import { ArrowRight, Clock, Info, Map as MapIcon, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { CATEGORY_ICON, CATEGORY_TONE, PhotoCredit, PlacePhoto, placePhoto, usePlaceSearch, type Place } from '@/entities/place';
import { localize } from '@/shared/api';
import { SITE_MEDIA } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { MapView, type MapViewMarker } from '@/shared/map';
import { Button, ErrorState, Reveal, Skeleton } from '@/shared/ui';
import { ArrowLink, ChapterNav, CtaBand, ExpoDistrictCards, MediaCredit, MediaImage, PageHero, Section, SectionHeading } from '@/widgets/public-site';

/**
 * Destinations (`/[locale]/destinations`): Expo 2030 Riyadh first (P-025, aligned with the
 * Expo-first home page: concept rendering, the four districts, facts and one honesty note), then
 * browse by place (Riyadh, Saudi Arabia) and by theme (heritage, nature, architecture &
 * landmarks). Places, coordinates and photos come from the destination repository (licensed
 * photos with credits); every collection opens the matching Discover filter. No prices, hours,
 * ratings or partnerships are shown.
 */
const COLLECTIONS = ['expo', 'riyadh', 'saudi', 'heritage', 'nature', 'landmarks'] as const;
type CollectionKey = (typeof COLLECTIONS)[number];

/** Architecture & landmarks is a curated selection (there is no such category in the data). */
const LANDMARK_IDS = ['plc_kingdom_centre', 'plc_kafd', 'plc_faisaliah', 'plc_murabba', 'plc_masmak', 'plc_king_fahd_fountain'];

const DISCOVER_HREF: Record<Exclude<CollectionKey, 'expo'>, string> = {
  riyadh: '/discover?region=riyadh',
  saudi: '/discover?region=saudi',
  heritage: '/discover?cat=heritage',
  nature: '/discover?cat=nature',
  landmarks: '/discover',
};

export function DestinationsPageView() {
  const t = useTranslations('site.destinations');
  const locale = useLocale();
  const query = usePlaceSearch({ locale, pageSize: 100 });
  const places = useMemo(() => query.data?.items ?? [], [query.data]);
  const chapters = useMemo(() => COLLECTIONS.map((id) => ({ id, label: t(`collections.${id}.nav`) })), [t]);

  const byCollection = useMemo(() => {
    const withPhotoFirst = (list: Place[]) => [...list].sort((a, b) => Number(Boolean(placePhoto(b, 'en'))) - Number(Boolean(placePhoto(a, 'en'))));
    return {
      riyadh: withPhotoFirst(places.filter((p) => p.region.regionCode === 'riyadh')),
      saudi: withPhotoFirst(places.filter((p) => p.region.regionCode === 'saudi')),
      heritage: withPhotoFirst(places.filter((p) => p.categories.some((c) => c === 'heritage' || c === 'museums' || c === 'culture'))),
      nature: withPhotoFirst(places.filter((p) => p.categories.includes('nature'))),
      landmarks: LANDMARK_IDS.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => Boolean(p)),
    };
  }, [places]);

  return (
    <>
      <PageHero
        eyebrow={t('hero.eyebrow')}
        titleLines={[t('hero.line1'), t('hero.line2')]}
        accentLine={1}
        intro={t('hero.intro')}
        media={SITE_MEDIA.hegra}
        actions={
          <Button asChild variant="gradient" size="lg" className="group">
            <Link href="/discover">
              {t('hero.cta')}
              <ArrowRight className="nudge flip-rtl" aria-hidden />
            </Link>
          </Button>
        }
      />
      <ChapterNav label={t('navLabel')} chapters={chapters} />
      <ExpoCollection />

      {query.isError ? (
        <Section>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </Section>
      ) : (
        <>
          <PlaceRail id="riyadh" places={byCollection.riyadh} loading={query.isPending} layout="feature" />
          <AtlasSection places={places} loading={query.isPending} />
          <SaudiSection places={byCollection.saudi} loading={query.isPending} />
          <PlaceRail id="heritage" places={byCollection.heritage} loading={query.isPending} layout="rail" />
          <PlaceRail id="nature" places={byCollection.nature} loading={query.isPending} layout="rail" />
          <PlaceRail id="landmarks" places={byCollection.landmarks} loading={query.isPending} layout="bento" />
        </>
      )}
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/discover', label: t('final.primary') }} secondary={{ href: '/chat', label: t('final.secondary') }} media={SITE_MEDIA.turaif} />
    </>
  );
}

// ───────────── Expo 2030 Riyadh — first, in the home page's design (P-025) ─────────────

function ExpoCollection() {
  const t = useTranslations('site.destinations.collections.expo');
  const media = SITE_MEDIA.expoSiteDusk;

  return (
    <Section id="expo" labelledBy="expo-title" className="scroll-mt-36">
      <SectionHeading
        id="expo-title"
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
      <div className="flex flex-col gap-3">
        <MediaImage media={media} reveal="clip" credit="none" sizes="(min-width: 1280px) 80rem, 100vw" className="aspect-[4/3] rounded-[2rem] sm:aspect-[2/1] lg:aspect-[5/2]" />
        <p className="text-fg-secondary flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span>{t('imageCaption')}</span>
          <MediaCredit media={media} variant="text" className="!text-[0.6875rem]" />
        </p>
      </div>
      <ExpoDistrictCards />
      <div className="border-border grid gap-5 border-y py-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
        <div className="flex flex-col gap-3 md:w-[24rem]">
          <dl className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <dt className="type-caption text-fg-muted">{t('factDatesLabel')}</dt>
              <dd className="font-display text-lg font-bold">{t('factDates')}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="type-caption text-fg-muted">{t('factCityLabel')}</dt>
              <dd className="font-display text-lg font-bold">{t('factCity')}</dd>
            </div>
          </dl>
          <p className="type-caption text-fg-muted">{t('factSource')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <p role="note" className="border-warning/30 bg-warning-tint text-warning-fg flex h-fit items-start gap-2 rounded-xl border px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('disclaimer')}
          </p>
          <ArrowLink href="/blog/preparing-for-expo-2030-riyadh">{t('read')}</ArrowLink>
        </div>
      </div>
    </Section>
  );
}

// ───────────── Collections ─────────────

function PlaceRail({ id, places, loading, layout }: { id: Exclude<CollectionKey, 'expo' | 'saudi'>; places: Place[]; loading: boolean; layout: 'feature' | 'bento' | 'rail' }) {
  const t = useTranslations('site.destinations');
  const shown = places.slice(0, layout === 'rail' ? 8 : 5);

  return (
    <Section id={id} labelledBy={`${id}-title`} className="border-border scroll-mt-36 border-t">
      <SectionHeading
        id={`${id}-title`}
        eyebrow={t(`collections.${id}.eyebrow`)}
        title={t(`collections.${id}.title`)}
        intro={t(`collections.${id}.intro`)}
        actions={<ArrowLink href={DISCOVER_HREF[id]}>{t('openInDiscover', { count: places.length })}</ArrowLink>}
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-80 rounded-[1.5rem]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="border-border text-fg-secondary rounded-2xl border border-dashed p-6 text-center text-sm">{t('empty')}</p>
      ) : layout === 'rail' ? (
        // Horizontal, snap-scrolling rail (keyboard: each card is a link)
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
          {shown.map((place, i) => (
            <Reveal as="li" key={place.id} delay={Math.min(i, 4) * 70} className="w-[16.5rem] shrink-0 snap-start sm:w-[19rem]">
              <PlaceTile place={place} className="h-[24rem]" />
            </Reveal>
          ))}
        </ul>
      ) : (
        <ul className={cn('grid gap-4', layout === 'feature' ? 'auto-rows-[15rem] sm:grid-cols-2 lg:grid-cols-4' : 'auto-rows-[14rem] sm:grid-cols-2 lg:grid-cols-3')}>
          {shown.map((place, i) => (
            <Reveal
              as="li"
              key={place.id}
              variant={i === 0 ? 'clip' : 'rise'}
              delay={i * 80}
              className={cn(layout === 'feature' && i === 0 && 'sm:col-span-2 sm:row-span-2', layout === 'bento' && i === 0 && 'lg:row-span-2', layout === 'bento' && i === 3 && 'sm:col-span-2 lg:col-span-1')}
            >
              <PlaceTile place={place} large={i === 0} className="h-full" />
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Photo tile linking to the place in Discover, with the photo credit underneath the image. */
function PlaceTile({ place, large = false, className }: { place: Place; large?: boolean; className?: string }) {
  const t = useTranslations('site.destinations');
  const td = useTranslations('discover.categories');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const name = localize(place.name, locale);
  const photo = placePhoto(place, locale);
  const category = place.categories[0]!;
  return (
    <div className={cn('group relative isolate flex flex-col overflow-hidden rounded-[1.5rem]', className)}>
      <PlacePhoto
        photo={photo}
        label={name}
        tone={CATEGORY_TONE[category]}
        icon={CATEGORY_ICON[category]}
        sizes={large ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 60vw'}
        className="absolute inset-0 -z-10 size-full transition-transform duration-[1200ms] group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />
      <div aria-hidden className="from-ink/85 via-ink/20 absolute inset-0 -z-10 bg-linear-to-t to-transparent" />
      <Link href={`/discover/${place.id}`} className="focus-ring mt-auto flex flex-col gap-1 rounded-[1.5rem] p-5 text-white" aria-label={t('openPlace', { name })}>
        <span className="text-[0.6875rem] font-bold text-white/75">{td(category)}</span>
        <span className={cn('font-display font-extrabold', large ? 'text-3xl' : 'text-xl')}>{name}</span>
        <span className="inline-flex items-center gap-1 text-xs text-white/80">
          <MapPin className="size-3.5" aria-hidden />
          {localize(place.region.city, locale)} · {formatDuration(place.suggestedDurationMin)}
        </span>
        {large && <span className="line-clamp-2 max-w-md text-sm text-white/85">{localize(place.summary, locale)}</span>}
      </Link>
      {photo?.credit && (
        <PhotoCredit photo={photo} label="" className="absolute end-3 top-3 max-w-[70%] truncate rounded-full bg-ink/65 px-2 py-0.5 !text-[0.625rem] !text-white/90 backdrop-blur-sm" />
      )}
    </div>
  );
}

// ───────────── Saudi Arabia — the home page's card language (P-025) ─────────────

function SaudiSection({ places, loading }: { places: Place[]; loading: boolean }) {
  const t = useTranslations('site.destinations');
  const shown = places.slice(0, 6);

  return (
    <Section id="saudi" labelledBy="saudi-title" className="border-border scroll-mt-36 border-t">
      <SectionHeading
        id="saudi-title"
        eyebrow={t('collections.saudi.eyebrow')}
        title={t('collections.saudi.title')}
        intro={t('collections.saudi.intro')}
        actions={<ArrowLink href={DISCOVER_HREF.saudi}>{t('openInDiscover', { count: places.length })}</ArrowLink>}
      />
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[26rem] rounded-[1.75rem]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="border-border text-fg-secondary rounded-2xl border border-dashed p-6 text-center text-sm">{t('empty')}</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((place, i) => (
            <Reveal as="li" key={place.id} delay={Math.min(i, 5) * 80} className="h-full">
              <PlaceCard place={place} />
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Photo on top, text below (like the home page's district cards); the whole card opens the place. */
function PlaceCard({ place }: { place: Place }) {
  const t = useTranslations('site.destinations');
  const td = useTranslations('discover.categories');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const name = localize(place.name, locale);
  const photo = placePhoto(place, locale);
  const category = place.categories[0]!;
  return (
    <div className="group bg-surface border-border relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden">
        <PlacePhoto
          photo={photo}
          label={name}
          tone={CATEGORY_TONE[category]}
          icon={CATEGORY_ICON[category]}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="absolute inset-0 size-full transition-transform duration-[1200ms] group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-fg-muted inline-flex items-center gap-1 text-xs font-bold">
          <MapPin className="size-3.5" aria-hidden />
          {localize(place.region.city, locale)} · {td(category)}
        </span>
        <h3 className="font-display text-2xl font-extrabold">{name}</h3>
        <p className="text-fg-secondary line-clamp-2 text-sm">{localize(place.summary, locale)}</p>
        <span className="text-fg-muted inline-flex items-center gap-1 text-xs">
          <Clock className="size-3.5" aria-hidden />
          {formatDuration(place.suggestedDurationMin)}
        </span>
        {/* Stretched link: the whole card opens the place; the photo credit stays its own link above it */}
        <Link
          href={`/discover/${place.id}`}
          aria-label={t('openPlace', { name })}
          className="focus-ring text-primary mt-auto inline-flex w-fit items-center gap-1.5 rounded-sm pt-3 text-sm font-bold after:absolute after:inset-0 after:rounded-[1.75rem]"
        >
          {t('collections.saudi.cardCta')}
          <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
        </Link>
      </div>
      {photo?.credit && (
        <PhotoCredit photo={photo} label="" className="absolute end-3 top-3 z-[2] max-w-[70%] truncate rounded-full bg-ink/65 px-2 py-0.5 !text-[0.625rem] !text-white/90 backdrop-blur-sm" />
      )}
    </div>
  );
}

// ───────────── Location-based browsing: the real map ─────────────

function AtlasSection({ places, loading }: { places: Place[]; loading: boolean }) {
  const t = useTranslations('site.destinations.atlas');
  const locale = useLocale();
  const [region, setRegion] = useState<'all' | 'riyadh' | 'saudi'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const shown = useMemo(() => places.filter((p) => region === 'all' || p.region.regionCode === region), [places, region]);
  const markers = useMemo<MapViewMarker[]>(
    () => shown.map((p) => ({ id: p.id, position: p.location, label: localize(p.name, locale), kind: 'place', icon: CATEGORY_ICON[p.categories[0]!] })),
    [shown, locale],
  );
  const place = shown.find((p) => p.id === selected);

  return (
    <Section labelledBy="atlas-title" className="border-border border-t">
      <SectionHeading id="atlas-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Reveal variant="clip" className="border-border bg-surface h-[24rem] overflow-hidden rounded-[1.75rem] border sm:h-[32rem]">
          {loading ? <Skeleton className="size-full rounded-none" /> : <MapView mode="geo" label={t('mapLabel')} markers={markers} selectedId={selected} onSelect={setSelected} className="size-full" />}
        </Reveal>
        <div className="flex flex-col gap-3">
          <div role="group" aria-label={t('regionLabel')} className="bg-surface-muted grid grid-cols-3 gap-1 rounded-full p-1">
            {(['all', 'riyadh', 'saudi'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={region === r}
                onClick={() => {
                  setRegion(r);
                  setSelected(null);
                }}
                className={cn('focus-ring h-9 rounded-full text-sm font-bold transition-colors', region === r ? 'bg-surface text-fg shadow-sm' : 'text-fg-secondary')}
              >
                {t(`regions.${r}`)}
              </button>
            ))}
          </div>
          <ul className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pe-1" aria-label={t('listLabel')}>
            {shown.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={selected === p.id}
                  onClick={() => setSelected(p.id)}
                  className={cn('focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm transition-colors', selected === p.id ? 'bg-primary-tint text-primary' : 'hover:bg-surface-muted')}
                >
                  <span className="[&_svg]:size-4" aria-hidden>
                    {CATEGORY_ICON[p.categories[0]!]}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{localize(p.name, locale)}</span>
                  <span className="text-fg-muted shrink-0 text-xs">{localize(p.region.city, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
          {place && (
            <Button asChild className="animate-pop-in group">
              <Link href={`/discover/${place.id}`}>
                {t('open', { name: localize(place.name, locale) })}
                <ArrowRight className="nudge flip-rtl" aria-hidden />
              </Link>
            </Button>
          )}
          <p className="type-caption text-fg-muted">{t('note')}</p>
        </div>
      </div>
    </Section>
  );
}
