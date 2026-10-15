'use client';

import { Clock, Landmark, MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Badge, DemoBadge, PriorityBadge, type PriorityLevel } from '@/shared/ui';
import type { PlacePhotoData } from '../model/destination';
import { PhotoCredit, PlacePhoto } from './place-photo';

export type PlaceCardData = {
  name: string;
  category: string;
  area: string;
  /** Duration suggested *in this plan* (not a generic "full day") */
  duration: string;
  summary: string;
  highlights?: string[];
  priority?: PriorityLevel;
  /** Opening hours are always demo data in v1 (D-024) */
  hours?: string;
  /** Licensed photo (with credit); placeholder when absent */
  photo?: PlacePhotoData;
};

type PlaceDetailCardProps = {
  place: PlaceCardData;
  /**
   * Contextual actions (D-022): proposal → keep/remove · Discover → Add to plan · always "Ask {character}".
   * Pass null when a surrounding sheet renders them in its fixed footer.
   */
  actions: ReactNode;
  /** floating: over the map with its own close button · embedded: inside a sheet that has one */
  variant?: 'floating' | 'embedded';
  onClose?: () => void;
  className?: string;
  /** id of the heading, for aria-labelledby on the surrounding dialog */
  headingId?: string;
};

/**
 * Place details used over the map (desktop) and inside a bottom sheet (mobile).
 * No ratings, review counts or distance-from-user (PRD §3 honesty rules).
 */
export const PlaceDetailCard = forwardRef<HTMLDivElement, PlaceDetailCardProps>(function PlaceDetailCard(
  { place, actions, variant = 'floating', onClose, className, headingId },
  ref,
) {
  const t = useTranslations('place');
  const floating = variant === 'floating';

  return (
    <div
      ref={ref}
      // Floating cards receive focus when opened from a marker (keyboard users land inside the card)
      tabIndex={floating ? -1 : undefined}
      className={cn(
        'flex flex-col overflow-hidden',
        floating && 'border-border glass animate-pop-in rounded-xl border shadow-lg',
        className,
      )}
    >
      <div className="relative">
        <PlacePhoto photo={place.photo} icon={<Landmark />} label={place.name} sizes="24rem" className={cn('aspect-[16/9] w-full', !floating && 'rounded-lg')} />
        {floating && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="focus-ring bg-surface/90 text-fg hover:bg-surface absolute end-3 top-3 grid size-9 cursor-pointer place-items-center rounded-full shadow-md backdrop-blur-sm"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto', floating ? 'p-5' : 'pt-4')}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 id={headingId} className="type-h3">
              {place.name}
            </h3>
            <p className="type-body-sm text-fg-secondary flex items-center gap-1 font-normal">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {place.area}
            </p>
          </div>
          {place.priority && <PriorityBadge level={place.priority} />}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{place.category}</Badge>
          <Badge tone="primary">
            <Clock aria-hidden />
            {t('suggestedDuration', { duration: place.duration })}
          </Badge>
        </div>

        <p className="type-body text-fg-secondary" dir="auto">
          {place.summary}
        </p>
        <PhotoCredit photo={place.photo} label={t('photoBy')} />

        {place.highlights && place.highlights.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="type-h4 text-base">{t('whatYouWillSee')}</p>
            <ul className="type-body text-fg-secondary list-disc space-y-1 ps-5" dir="auto">
              {place.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        {place.hours && (
          <div className="bg-surface-muted flex flex-wrap items-center gap-2 rounded-md px-3 py-2">
            <span className="type-body-sm">{place.hours}</span>
            <DemoBadge label={t('verifyHours')} />
          </div>
        )}
      </div>

      {actions && (
        <div className={cn('border-border flex flex-wrap gap-2 border-t', floating ? 'p-4' : 'pt-4')}>
          {actions}
        </div>
      )}
    </div>
  );
});
