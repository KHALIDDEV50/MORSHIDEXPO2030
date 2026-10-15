'use client';

import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type CSSProperties } from 'react';
import { SITE_MEDIA, type SiteMedia } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { zoneColor } from '@/shared/map';
import { Reveal } from '@/shared/ui';
import { MediaImage } from './site-blocks';

/**
 * The four thematic districts of the illustrative Expo layout (P-023). Ids, numbers and colour
 * tokens match the demo layout in entities/expo, so each card opens `/expo?zone=<id>` framed on
 * that district; each card uses the district's own concept rendering. Shared by the home page and
 * the Destinations page (P-024/P-025) so the two never drift apart.
 */
export const EXPO_DISTRICTS: { key: 'earth' | 'collaboration' | 'technology' | 'humanity'; id: string; number: number; color: string; media: SiteMedia }[] = [
  { key: 'earth', id: 'zone_earth', number: 1, color: 'amber', media: SITE_MEDIA.expoTowerGarden },
  { key: 'collaboration', id: 'zone_collaboration', number: 2, color: 'pink', media: SITE_MEDIA.expoGatheringPlaza },
  { key: 'technology', id: 'zone_technology', number: 3, color: 'blue', media: SITE_MEDIA.expoTowerInterior },
  { key: 'humanity', id: 'zone_humanity', number: 4, color: 'violet', media: SITE_MEDIA.expoConePavilions },
];

export function ExpoDistrictCards() {
  const t = useTranslations('site.expoDistricts');
  const locale = useLocale();

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {EXPO_DISTRICTS.map((z, i) => (
        <Reveal as="li" key={z.key} delay={i * 90}>
          <Link
            href={`/expo?zone=${z.id}`}
            className="group focus-ring bg-surface border-border flex h-full flex-col overflow-hidden rounded-[1.75rem] border shadow-sm transition-shadow hover:shadow-md"
            style={{ '--zone-color': zoneColor(z.color) } as CSSProperties}
          >
            <div className="relative aspect-[16/10] lg:aspect-[4/5]">
              <MediaImage
                media={z.media}
                credit="none"
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                className="!absolute inset-0"
                imageClassName="transition-transform duration-[1200ms] group-hover:scale-105 motion-reduce:group-hover:scale-100"
              />
              <span aria-hidden className="font-display absolute start-4 bottom-4 z-[1] grid size-10 place-items-center rounded-full bg-[var(--zone-color)] text-lg font-extrabold text-white shadow-md">
                {z.number}
              </span>
            </div>
            <span aria-hidden className="h-1 bg-[var(--zone-color)]" />
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-fg-muted text-xs font-bold">{t('districtLabel', { number: z.number })}</span>
              <h3 className="font-display flex flex-wrap items-baseline gap-x-2 text-2xl font-extrabold">
                {t(`items.${z.key}.name`)}
                {locale !== 'ar' && (
                  <span lang="ar" dir="rtl" className="text-fg-muted text-lg font-bold">
                    {t(`items.${z.key}.native`)}
                  </span>
                )}
              </h3>
              <p className="text-fg-secondary text-sm">{t(`items.${z.key}.body`)}</p>
              <p className="text-fg-muted text-xs font-bold">{t(`items.${z.key}.topics`)}</p>
              <span className="text-primary mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-bold">
                {t('cta')}
                <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
