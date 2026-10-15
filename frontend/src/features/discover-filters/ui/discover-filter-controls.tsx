'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { CATEGORY_ICON, DESTINATION_CATEGORIES, type DestinationCategory } from '@/entities/place';
import { cn } from '@/shared/lib';
import { Label, SegmentedControl, Select, Switch } from '@/shared/ui';
import { DURATION_OPTIONS, type DiscoverParams, type DiscoverSort } from '../model/discover-params';

type Props = {
  params: DiscoverParams;
  onChange: (patch: Partial<DiscoverParams>) => void;
  /** `stacked` inside the mobile sheet, `inline` in the desktop bar */
  layout?: 'inline' | 'stacked';
  className?: string;
};

/** Category chips (multi-select, ✓ when selected — design-system §16). */
export function CategoryChips({ selected, onToggle, className }: { selected: DestinationCategory[]; onToggle: (c: DestinationCategory) => void; className?: string }) {
  const t = useTranslations('discover');
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label={t('categoriesLabel')}>
      {DESTINATION_CATEGORIES.map((c) => {
        const on = selected.includes(c);
        return (
          <li key={c}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c)}
              className={cn(
                'focus-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors [&_svg]:size-3.5',
                on ? 'bg-fg text-background border-transparent' : 'border-border bg-surface text-fg-secondary hover:border-border-strong hover:text-fg',
              )}
            >
              <span aria-hidden>{on ? <Check /> : CATEGORY_ICON[c]}</span>
              {t(`categories.${c}`)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Location filter (design-system segmented control): All · Riyadh · Outside Riyadh. Uses each
 * destination's region in the data ('riyadh' = Riyadh city, 'saudi' = outside it).
 */
export function RegionFilter({ value, onChange, className }: { value: DiscoverParams['region']; onChange: (region: DiscoverParams['region']) => void; className?: string }) {
  const td = useTranslations('discover');
  return (
    <SegmentedControl
      label={td('regionLabel')}
      value={value ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? null : v)}
      className={className}
      options={[
        { value: 'all', label: td('region.all') },
        { value: 'riyadh', label: td('region.riyadh') },
        { value: 'saudi', label: td('region.saudi') },
      ]}
    />
  );
}

export function toggleCategory(list: DestinationCategory[], c: DestinationCategory): DestinationCategory[] {
  return list.includes(c) ? list.filter((x) => x !== c) : [...list, c];
}

/**
 * The filter set (PRD §4.2): category, visit duration, family-friendly, indoor / outdoor. Location
 * (RegionFilter) sits in the always-visible results bar. Every change applies immediately — the same query drives the list and the map.
 */
export function DiscoverFilterControls({ params, onChange, layout = 'inline', className }: Props) {
  const t = useTranslations('discoverPage.filters');
  const familyId = useId();
  const durationId = useId();
  const stacked = layout === 'stacked';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-2">
        {stacked && <span className="text-sm font-bold">{t('categories')}</span>}
        <CategoryChips selected={params.categories} onToggle={(c) => onChange({ categories: toggleCategory(params.categories, c) })} />
      </div>
      <div className={cn('flex gap-4', stacked ? 'flex-col' : 'flex-wrap items-end')}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={durationId}>{t('duration')}</Label>
          <Select
            id={durationId}
            value={String(params.maxDuration ?? 'any')}
            onValueChange={(v) => onChange({ maxDuration: v === 'any' ? null : (Number(v) as DiscoverParams['maxDuration']) })}
            options={[{ value: 'any', label: t('durationAny') }, ...DURATION_OPTIONS.map((d) => ({ value: String(d), label: t('durationUpTo', { hours: d / 60 }) }))]}
            className="min-w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t('setting')}</span>
          <SegmentedControl
            label={t('setting')}
            value={params.setting ?? 'any'}
            onValueChange={(v) => onChange({ setting: v === 'any' ? null : v })}
            options={[
              { value: 'any', label: t('settingAny') },
              { value: 'indoor', label: t('indoor') },
              { value: 'outdoor', label: t('outdoor') },
            ]}
          />
        </div>
        <div className="flex h-10 items-center gap-2.5 self-start sm:self-end">
          <Switch id={familyId} checked={params.family} onCheckedChange={(on) => onChange({ family: on })} />
          <Label htmlFor={familyId} className="cursor-pointer">
            {t('family')}
          </Label>
        </div>
      </div>
    </div>
  );
}

/** Sort (PRD §4.2): relevance = keyword match, then featured. */
export function DiscoverSortSelect({ value, onChange, className }: { value: DiscoverSort; onChange: (sort: DiscoverSort) => void; className?: string }) {
  const t = useTranslations('discoverPage.sort');
  return (
    <Select
      aria-label={t('label')}
      value={value}
      onValueChange={(v) => onChange(v as DiscoverSort)}
      options={[
        { value: 'relevance', label: t('relevance') },
        { value: 'name', label: t('name') },
        { value: 'duration', label: t('duration') },
      ]}
      className={cn('min-w-44', className)}
    />
  );
}
