'use client';

import { CalendarPlus, List, Map as MapIcon, MapPinned, ScanSearch, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { AddToPlanButton, AddToPlanDialog } from '@/features/add-to-plan';
import {
  activeFilterCount,
  clearFilters,
  DiscoverFilterControls,
  DiscoverSortSelect,
  RegionFilter,
  toPlaceQuery,
  useDiscoverParams,
} from '@/features/discover-filters';
import { CATEGORY_ICON, DestinationCard, PlaceMapPopup, usePlaceCardData, usePlaceDetailData, usePlaceSearch, type Place } from '@/entities/place';
import { localize, type Bounds } from '@/shared/api';
import { useRouter } from '@/shared/i18n';
import { MapView, type MapViewMarker } from '@/shared/map';
import { Button, CardSkeleton, EmptyState, ErrorState, IconButton, SegmentedControl, Sheet, SheetContent } from '@/shared/ui';

/**
 * Discover results (PRD §4.2): filters, sort and a list / map toggle. One repository query feeds
 * both views, so they always agree. "Search this area" limits results to the real map bounds.
 */
export function DiscoverResults() {
  const t = useTranslations('discoverPage');
  const locale = useLocale();
  const [params, update] = useDiscoverParams();
  const query = useMemo(() => toPlaceQuery(params, locale), [params, locale]);
  const search = usePlaceSearch(query);
  const results = search.data?.items ?? [];
  const filterCount = activeFilterCount(params);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addPlace, setAddPlace] = useState<Place | null>(null);

  return (
    <section aria-label={t('resultsLabel')} className="flex flex-col gap-4">
      {/* Location: always visible, the active option is highlighted */}
      <RegionFilter value={params.region} onChange={(region) => update({ region })} className="self-start" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
          <SlidersHorizontal aria-hidden />
          {filterCount > 0 ? t('filtersButtonCount', { count: filterCount }) : t('filtersButton')}
        </Button>
        <DiscoverSortSelect value={params.sort} onChange={(sort) => update({ sort })} />
        <SegmentedControl
          label={t('viewLabel')}
          value={params.view}
          onValueChange={(view) => update({ view })}
          options={[
            { value: 'list', label: t('viewList'), icon: <List /> },
            { value: 'map', label: t('viewMap'), icon: <MapIcon /> },
          ]}
          className="ms-auto"
        />
      </div>

      {/* Desktop: filters always visible */}
      <div className="border-border bg-surface hidden rounded-xl border p-4 lg:block">
        <DiscoverFilterControls params={params} onChange={update} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
        <p className="type-body-sm text-fg-secondary font-normal">{search.isPending ? t('searching') : t('resultsCount', { count: search.data?.total ?? 0 })}</p>
        <div className="flex flex-wrap items-center gap-2">
          {params.area && (
            <span className="border-primary/40 bg-primary/10 text-primary inline-flex h-8 items-center gap-1.5 rounded-full border ps-3 pe-1 text-sm font-medium">
              <ScanSearch className="size-4" aria-hidden />
              {t('areaChip')}
              <button type="button" aria-label={t('clearArea')} onClick={() => update({ area: null })} className="focus-ring hover:bg-primary/15 grid size-6 place-items-center rounded-full">
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          )}
          {filterCount > 0 && (
            <Button size="sm" variant="ghost" onClick={() => update(clearFilters)}>
              <X aria-hidden />
              {t('clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {search.isError ? (
        <ErrorState error={search.error} onRetry={() => void search.refetch()} retrying={search.isFetching} className="border-border rounded-xl border" />
      ) : params.view === 'map' ? (
        <ResultsMap places={results} area={params.area} onSearchArea={(area) => update({ area })} loading={search.isPending} />
      ) : search.isPending ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      ) : results.length === 0 ? (
        <div className="border-border bg-surface rounded-xl border">
          <EmptyState
            icon={<SearchX />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={
              <Button variant="secondary" onClick={() => update((p) => ({ ...clearFilters(p), q: '' }))}>
                {t('clearAll')}
              </Button>
            }
          />
        </div>
      ) : (
        <ResultsList places={results} onAdd={setAddPlace} />
      )}

      {/* Mobile filters sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          title={t('filtersTitle')}
          footer={
            <div className="flex w-full gap-2">
              {filterCount > 0 && (
                <Button variant="ghost" onClick={() => update(clearFilters)}>
                  {t('clearFilters')}
                </Button>
              )}
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                {t('showResults', { count: search.data?.total ?? 0 })}
              </Button>
            </div>
          }
        >
          <DiscoverFilterControls params={params} onChange={update} layout="stacked" />
        </SheetContent>
      </Sheet>

      {addPlace && <AddToPlanDialog place={addPlace} open onOpenChange={(o) => !o && setAddPlace(null)} />}
    </section>
  );
}

function ResultsList({ places, onAdd }: { places: Place[]; onAdd: (place: Place) => void }) {
  const t = useTranslations('discoverPage');
  const toCard = usePlaceCardData();
  const router = useRouter();
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => {
        const card = toCard(place);
        return (
          <li key={place.id}>
            <DestinationCard
              place={card}
              onOpen={(id) => router.push(`/discover/${id}`)}
              openLabel={t('openDetails', { name: card.name })}
              action={<IconButton size="icon-sm" variant="secondary" label={t('addToPlanNamed', { name: card.name })} icon={<CalendarPlus aria-hidden />} onClick={() => onAdd(place)} />}
            />
          </li>
        );
      })}
    </ul>
  );
}

function ResultsMap({
  places,
  area,
  onSearchArea,
  loading,
}: {
  places: Place[];
  area: Bounds | null;
  onSearchArea: (area: Bounds) => void;
  loading: boolean;
}) {
  const t = useTranslations('discoverPage');
  const locale = useLocale();
  const router = useRouter();
  const toDetail = usePlaceDetailData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewBounds, setViewBounds] = useState<Bounds | null>(null);
  const selected = places.find((p) => p.id === selectedId) ?? null;

  const markers = useMemo<MapViewMarker[]>(
    () =>
      places.map((p) => ({
        id: p.id,
        position: p.location,
        label: localize(p.name, locale),
        kind: 'place',
        icon: CATEGORY_ICON[p.categories[0]!],
      })),
    [places, locale],
  );

  // Offer "Search this area" once the visible area differs from the applied one
  const areaChanged = viewBounds !== null && (!area || ['north', 'south', 'east', 'west'].some((k) => Math.abs(viewBounds[k as keyof Bounds] - area[k as keyof Bounds]) > 1e-4));

  return (
    <div className="@container relative">
      <MapView
        mode="geo"
        label={t('mapLabel')}
        markers={markers}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onBoundsChange={setViewBounds}
        // After "Search this area" the camera stays where the user put it
        fitToMarkers={!area}
        className="border-border h-[calc(100dvh-16rem)] min-h-[24rem] rounded-xl border lg:h-[36rem]"
      />
      {areaChanged && !loading && (
        <Button
          size="sm"
          className="absolute start-1/2 top-3 z-10 -translate-x-1/2 shadow-md rtl:translate-x-1/2"
          onClick={() => {
            setSelectedId(null);
            onSearchArea(viewBounds);
          }}
        >
          <ScanSearch aria-hidden />
          {t('searchThisArea')}
        </Button>
      )}
      {places.length === 0 && !loading && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-10 flex justify-center px-4">
          <p className="bg-surface/95 border-border rounded-full border px-4 py-2 text-sm shadow-sm">
            <MapPinned className="text-fg-muted me-1.5 inline size-4" aria-hidden />
            {t('mapEmpty')}
          </p>
        </div>
      )}
      {/* Place details over the map (design system): the map keeps its view; ✕ / Esc returns to it */}
      {selected && (
        <PlaceMapPopup
          place={toDetail(selected)}
          onClose={() => setSelectedId(null)}
          actions={
            <div className="flex w-full flex-wrap gap-2 [&>*]:flex-1">
              <Button onClick={() => router.push(`/discover/${selected.id}`)}>{t('viewDetails')}</Button>
              <AddToPlanButton place={selected} variant="secondary" />
            </div>
          }
        />
      )}
    </div>
  );
}
