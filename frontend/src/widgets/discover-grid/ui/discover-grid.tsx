'use client';

import { CalendarPlus, Check, MessageCircle, SearchX, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  CategoryTile,
  DESTINATION_CATEGORIES,
  DestinationCard,
  FeaturedDestinationCard,
  filterDestinations,
  PlaceDetailCard,
  type DestinationCardData,
  type DestinationCategory,
  type DestinationRegion,
  type PlaceCardData,
} from '@/entities/place';
import { cn } from '@/shared/lib';
import {
  Button,
  CardSkeleton,
  EmptyState,
  IconButton,
  SearchField,
  SegmentedControl,
  Sheet,
  SheetContent,
  toast,
} from '@/shared/ui';

export type DiscoverItem = DestinationCardData & { details: PlaceCardData };

/**
 * Editorial Discover grid (P-013): featured destinations (bento on wide / swipeable on narrow),
 * a standard card grid, and compact category tiles — all driven by one search + filter state.
 * Container-responsive, so it adapts to the space it is given (page, panel or preview frame).
 */
export function DiscoverGrid({ items, loading = false, className }: { items: DiscoverItem[]; loading?: boolean; className?: string }) {
  const t = useTranslations('discover');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<DestinationRegion | 'all'>('all');
  const [categories, setCategories] = useState<ReadonlySet<DestinationCategory>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => filterDestinations(items, { query, region, categories }), [items, query, region, categories]);
  const featured = results.filter((i) => i.featured).slice(0, 3);
  const rest = results.filter((i) => !featured.includes(i));
  const filtering = query !== '' || region !== 'all' || categories.size > 0;
  const open = items.find((i) => i.id === openId) ?? null;
  const countByCategory = useMemo(() => {
    const map = new Map<DestinationCategory, number>();
    for (const item of filterDestinations(items, { query: '', region, categories: new Set() })) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    return map;
  }, [items, region]);

  const toggleCategory = (c: DestinationCategory) =>
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  const clear = () => {
    setQuery('');
    setRegion('all');
    setCategories(new Set());
  };

  const addAction = (item: DiscoverItem, onDark = false) => (
    <IconButton
      size="icon-sm"
      variant={onDark ? 'ghost' : 'secondary'}
      label={t('addToPlanNamed', { name: item.name })}
      icon={<CalendarPlus aria-hidden />}
      onClick={() => toast.success(t('addedToast', { name: item.name }))}
      className={cn(onDark && 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25')}
    />
  );

  return (
    <section aria-label={t('label')} className={cn('@container flex flex-col gap-6', className)}>
      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <SearchField size="lg" label={t('searchLabel')} placeholder={t('searchPlaceholder')} value={query} onValueChange={setQuery} />
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            label={t('regionLabel')}
            value={region}
            onValueChange={setRegion}
            options={[
              { value: 'all', label: t('region.all') },
              { value: 'riyadh', label: t('region.riyadh') },
              { value: 'saudi', label: t('region.saudi') },
            ]}
          />
          <ul className="flex flex-wrap gap-2" aria-label={t('categoriesLabel')}>
            {DESTINATION_CATEGORIES.map((c) => {
              const selected = categories.has(c);
              return (
                <li key={c}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCategory(c)}
                    className={cn(
                      'focus-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                      selected ? 'bg-fg text-background border-transparent' : 'border-border bg-surface text-fg-secondary hover:border-border-strong hover:text-fg',
                    )}
                  >
                    {selected && <Check className="size-3.5" aria-hidden />}
                    {t(`categories.${c}`)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
          <p className="type-body-sm text-fg-secondary font-normal">{t('resultsCount', { count: results.length })}</p>
          {filtering && (
            <Button size="sm" variant="ghost" onClick={clear}>
              <X aria-hidden />
              {t('clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="border-border bg-surface rounded-xl border">
          <EmptyState
            icon={<SearchX />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={
              <Button variant="secondary" onClick={clear}>
                {t('clearFilters')}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="type-h3">{t('featuredTitle')}</h3>
              {/* Narrow: swipeable row · wide: bento (1 large + 2 stacked) */}
              <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] @3xl:mx-0 @3xl:grid @3xl:grid-cols-3 @3xl:grid-rows-2 @3xl:gap-4 @3xl:overflow-visible @3xl:px-0">
                {featured.map((item, i) => (
                  <li
                    key={item.id}
                    className={cn(
                      'w-[82%] shrink-0 snap-start @md:w-[60%] @3xl:w-auto',
                      i === 0 ? '@3xl:col-span-2 @3xl:row-span-2 @3xl:min-h-[26rem]' : '@3xl:min-h-[12.5rem]',
                    )}
                  >
                    <FeaturedDestinationCard
                      place={item}
                      onOpen={setOpenId}
                      openLabel={t('openDetails', { name: item.name })}
                      action={addAction(item, true)}
                      className="@3xl:min-h-0"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rest.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="type-h3">{filtering ? t('resultsTitle') : t('allTitle')}</h3>
              <ul className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
                {rest.map((item) => (
                  <li key={item.id}>
                    <DestinationCard place={item} onOpen={setOpenId} openLabel={t('openDetails', { name: item.name })} action={addAction(item)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Compact category tiles */}
      <div className="flex flex-col gap-3">
        <h3 className="type-h3">{t('browseByCategory')}</h3>
        <ul className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
          {DESTINATION_CATEGORIES.map((c) => (
            <li key={c}>
              <CategoryTile
                category={c}
                label={t(`categories.${c}`)}
                count={countByCategory.get(c) ?? 0}
                countLabel={t('placesCount')}
                selected={categories.has(c)}
                onToggle={toggleCategory}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Detail view: existing place card in a responsive sheet (D-022 contextual actions) */}
      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        {open && (
          <SheetContent
            side="responsive"
            title={open.name}
            hideTitle
            footer={
              <div className="flex w-full gap-2 [&>*]:flex-1">
                <Button onClick={() => toast.success(t('addedToast', { name: open.name }))}>
                  <CalendarPlus aria-hidden />
                  {t('addToPlan')}
                </Button>
                <Button variant="secondary" onClick={() => toast(t('askToast'))}>
                  <MessageCircle aria-hidden />
                  {t('askArif')}
                </Button>
              </div>
            }
          >
            <PlaceDetailCard variant="embedded" place={open.details} actions={null} />
          </SheetContent>
        )}
      </Sheet>
    </section>
  );
}
