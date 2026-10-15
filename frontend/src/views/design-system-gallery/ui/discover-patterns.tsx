'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { DestinationCategory, DestinationRegion } from '@/entities/place';
import { Label, Switch } from '@/shared/ui';
import { DiscoverGrid, type DiscoverItem } from '@/widgets/discover-grid';
import { DemoBlock, GallerySection } from './section';

type Key = 'turaif' | 'edge' | 'hegra' | 'masmak' | 'museum' | 'bujairi' | 'wadi' | 'skybridge' | 'kingAbdullahPark' | 'souq' | 'balad' | 'soudah';

const DEFS: { key: Key; category: DestinationCategory; region: DestinationRegion; featured?: boolean; minutes: number }[] = [
  { key: 'turaif', category: 'heritage', region: 'riyadh', featured: true, minutes: 120 },
  { key: 'edge', category: 'nature', region: 'riyadh', featured: true, minutes: 300 },
  { key: 'hegra', category: 'heritage', region: 'saudi', featured: true, minutes: 240 },
  { key: 'masmak', category: 'heritage', region: 'riyadh', minutes: 60 },
  { key: 'museum', category: 'museums', region: 'riyadh', minutes: 90 },
  { key: 'bujairi', category: 'food', region: 'riyadh', minutes: 90 },
  { key: 'wadi', category: 'nature', region: 'riyadh', minutes: 120 },
  { key: 'skybridge', category: 'entertainment', region: 'riyadh', minutes: 60 },
  { key: 'kingAbdullahPark', category: 'family', region: 'riyadh', minutes: 90 },
  { key: 'souq', category: 'shopping', region: 'riyadh', minutes: 60 },
  { key: 'balad', category: 'culture', region: 'saudi', minutes: 180 },
  { key: 'soudah', category: 'nature', region: 'saudi', minutes: 240 },
];

export function DiscoverPatterns() {
  const t = useTranslations('designSystem.discoverGrid');
  const tc = useTranslations('discover.categories');
  const tt = useTranslations('trip');
  const [loading, setLoading] = useState(false);

  const items = useMemo<DiscoverItem[]>(
    () =>
      DEFS.map((d) => {
        const h = Math.floor(d.minutes / 60);
        const m = d.minutes % 60;
        const duration = h && m ? tt('duration.hm', { h, m }) : h ? tt('duration.h', { h }) : tt('duration.m', { m });
        const name = t(`places.${d.key}.name`);
        return {
          id: d.key,
          name,
          area: t(`places.${d.key}.area`),
          region: d.region,
          category: d.category,
          categoryLabel: tc(d.category),
          summary: t(`places.${d.key}.summary`),
          tagline: d.featured ? t(`places.${d.key}.summary`) : undefined,
          duration,
          featured: d.featured,
          details: {
            name,
            category: tc(d.category),
            area: t(`places.${d.key}.area`),
            duration,
            summary: t(`places.${d.key}.summary`),
            hours: t('hoursDemo'),
          },
        };
      }),
    [t, tc, tt],
  );

  return (
    <GallerySection id="discover" title={t('title')} description={t('description')}>
      <DemoBlock label={t('controls')} className="gap-6">
        <div className="flex items-center gap-2">
          <Switch id="disc-loading" checked={loading} onCheckedChange={setLoading} />
          <Label htmlFor="disc-loading">{t('loading')}</Label>
        </div>
        <p className="type-caption text-fg-muted">{t('note')}</p>
      </DemoBlock>
      <DemoBlock label={t('wide')} className="block">
        <DiscoverGrid items={items} loading={loading} />
      </DemoBlock>
      <DemoBlock label={t('phone')} className="justify-center">
        <div className="border-border-strong bg-background w-full max-w-[24.375rem] overflow-hidden rounded-[2rem] border-[6px] p-4">
          <DiscoverGrid items={items} loading={loading} />
        </div>
      </DemoBlock>
    </GallerySection>
  );
}
