'use client';

import { ArrowUpRight, Map as MapIcon, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useMemo, useRef, useState } from 'react';
import { CategoryChips, RegionFilter, showsResults, toggleCategory, useDiscoverParams } from '@/features/discover-filters';
import {
  CategoryTile,
  DESTINATION_CATEGORIES,
  DestinationCard,
  FeaturedDestinationCard,
  usePlaceCardData,
  usePlaceSearch,
  useCollections,
  useFeaturedPlaces,
  type DestinationCategory,
  type Place,
} from '@/entities/place';
import { localize } from '@/shared/api';
import { Link, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { MapView, type MapViewMarker } from '@/shared/map';
import { CardSkeleton, ErrorState, SearchField, Skeleton } from '@/shared/ui';
import { DiscoverResults } from '@/widgets/discover-results';

/** Discover (PRD §4.2): home (search, chips, map preview, featured, collections) or results. */
export function DiscoverPageView() {
  return (
    // useSearchParams (URL state) needs a Suspense boundary on a statically rendered page
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverPage />
    </Suspense>
  );
}

function DiscoverPage() {
  const t = useTranslations('discoverPage');
  const [params, update] = useDiscoverParams();
  const results = showsResults(params);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-1">
        <h1 className="type-h1">{t('title')}</h1>
        <p className="type-body text-fg-secondary">{t('subtitle')}</p>
      </header>

      <SearchBar initial={params.q} onSearch={(q) => update({ q })} />
      {!results && <RegionFilter value={params.region} onChange={(region) => update({ region })} className="self-start" />}

      {results ? (
        <DiscoverResults />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <CategoryChips selected={params.categories} onToggle={(c) => update({ categories: toggleCategory(params.categories, c) })} className="flex-nowrap sm:flex-wrap" />
            {/* Expo is its own destination (D-012): this chip navigates, it doesn't filter */}
            <Link
              href="/expo"
              className="focus-ring border-primary/40 bg-surface-brand text-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold"
            >
              <Sparkles className="size-3.5" aria-hidden />
              {t('expoChip')}
              <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
            </Link>
          </div>
          <DiscoverHome onCategory={(c) => update({ categories: [c] })} onOpenMap={() => update({ view: 'map' })} />
        </>
      )}
    </div>
  );
}

/**
 * Search box: types freely and updates the URL after a short pause. If the URL's search changes
 * from elsewhere (e.g. "Clear all"), the box follows — but never while the visitor is typing.
 */
function SearchBar({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const t = useTranslations('discoverPage');
  const [text, setText] = useState(initial);
  const [typing, setTyping] = useState(false);
  const [lastInitial, setLastInitial] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Adjust state while rendering when the URL value changes (React's "derived state" pattern)
  if (initial !== lastInitial) {
    setLastInitial(initial);
    if (!typing && initial !== text.trim()) setText(initial);
  }

  const push = (value: string) => {
    setTyping(false);
    onSearch(value);
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        push(text);
      }}
    >
      <SearchField
        size="lg"
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={text}
        onValueChange={(value) => {
          setText(value);
          setTyping(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => push(value), value ? 300 : 0);
        }}
      />
    </form>
  );
}

function DiscoverHome({ onCategory, onOpenMap }: { onCategory: (c: DestinationCategory) => void; onOpenMap: () => void }) {
  const t = useTranslations('discoverPage');
  const td = useTranslations('discover');
  const locale = useLocale();
  const router = useRouter();
  const toCard = usePlaceCardData();
  const featured = useFeaturedPlaces();
  const collections = useCollections();
  const all = usePlaceSearch({ locale, pageSize: 100 });
  const byId = useMemo(() => new Map((all.data?.items ?? []).map((p) => [p.id, p])), [all.data]);
  const countByCategory = useMemo(() => {
    const map = new Map<DestinationCategory, number>();
    for (const p of all.data?.items ?? []) for (const c of p.categories) map.set(c, (map.get(c) ?? 0) + 1);
    return map;
  }, [all.data]);
  const open = (id: string) => router.push(`/discover/${id}`);

  if (featured.isError || collections.isError || all.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void featured.refetch();
          void collections.refetch();
          void all.refetch();
        }}
        className="border-border rounded-xl border"
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <MapPreviewCard places={all.data?.items ?? []} onOpen={onOpenMap} />

      {/* Featured: bento on wide screens, swipeable row on narrow (design-system §16) */}
      <section className="flex flex-col gap-3" aria-labelledby="featured-title">
        <h2 id="featured-title" className="type-h2">
          {td('featuredTitle')}
        </h2>
        {featured.isPending ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : (
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:grid-rows-2 md:gap-4 md:overflow-visible md:px-0">
            {(featured.data ?? []).slice(0, 3).map((place, i) => {
              const card = toCard(place);
              return (
                <li key={place.id} className={cn('w-[82%] shrink-0 snap-start sm:w-[60%] md:w-auto', i === 0 ? 'md:col-span-2 md:row-span-2 md:min-h-[26rem]' : 'md:min-h-[12.5rem]')}>
                  <FeaturedDestinationCard place={card} onOpen={open} openLabel={t('openDetails', { name: card.name })} className="md:min-h-0" />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Curated collections */}
      {collections.isPending || all.isPending ? (
        <div className="flex gap-4 overflow-hidden" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <CardSkeleton key={i} className="w-72 shrink-0" />
          ))}
        </div>
      ) : (
        (collections.data ?? []).map((collection) => {
          const places = collection.placeIds.map((id) => byId.get(id)).filter((p): p is Place => Boolean(p));
          if (places.length === 0) return null;
          const titleId = `col-${collection.id}`;
          return (
            <section key={collection.id} className="flex flex-col gap-3" aria-labelledby={titleId}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 id={titleId} className="type-h2">
                  {localize(collection.title, locale)}
                </h2>
                <span className="type-caption text-fg-muted">{t('placesInCollection', { count: places.length })}</span>
              </div>
              <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
                {places.map((place) => {
                  const card = toCard(place);
                  return (
                    <li key={place.id} className="w-72 shrink-0 snap-start">
                      <DestinationCard place={card} onOpen={open} openLabel={t('openDetails', { name: card.name })} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      <section className="flex flex-col gap-3" aria-labelledby="browse-title">
        <h2 id="browse-title" className="type-h2">
          {td('browseByCategory')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {DESTINATION_CATEGORIES.map((c) => (
            <li key={c}>
              <CategoryTile category={c} label={td(`categories.${c}`)} count={countByCategory.get(c) ?? 0} countLabel={td('placesCount')} selected={false} onToggle={onCategory} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * "Explore Riyadh on the map": a live map preview (inert — not a second interactive map) and one
 * real button whose hit area stretches over the whole card.
 */
function MapPreviewCard({ places, onOpen }: { places: Place[]; onOpen: () => void }) {
  const t = useTranslations('discoverPage');
  const locale = useLocale();
  const markers = useMemo<MapViewMarker[]>(
    () => places.filter((p) => p.region.regionCode === 'riyadh').map((p) => ({ id: p.id, position: p.location, label: localize(p.name, locale), kind: 'place' })),
    [places, locale],
  );
  return (
    <div className="group border-border bg-surface relative grid overflow-hidden rounded-2xl border md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col justify-center gap-2 p-5 md:p-6">
        <span className="bg-primary-tint text-primary grid size-10 place-items-center rounded-xl [&_svg]:size-5" aria-hidden>
          <MapIcon />
        </span>
        <h2 className="type-h3">{t('mapPreviewTitle')}</h2>
        <p className="type-body-sm text-fg-secondary font-normal">{t('mapPreviewText')}</p>
        <button
          type="button"
          onClick={onOpen}
          className="focus-ring text-primary mt-1 inline-flex w-fit cursor-pointer items-center gap-1 rounded-sm text-sm font-bold after:absolute after:inset-0 after:content-['']"
        >
          {t('mapPreviewCta')}
          <ArrowUpRight className="flip-rtl size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
      <div inert className="h-44 md:h-full md:min-h-56">
        {markers.length > 0 && <MapView mode="geo" label={t('mapPreviewTitle')} markers={markers} className="pointer-events-none size-full" />}
      </div>
    </div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );
}
