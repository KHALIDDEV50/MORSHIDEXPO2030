'use client';

import {
  Clock,
  Landmark,
  Library,
  MapPin,
  Mountain,
  Palette,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Badge, Card, CardDescription, CardEyebrow, CardLink, CardMedia, CardMeta, CardTitle } from '@/shared/ui';
import { PlacePhoto } from './place-photo';
import { CATEGORY_TONE, type DestinationCardData, type DestinationCategory } from '../model/destination';

export const CATEGORY_ICON: Record<DestinationCategory, ReactNode> = {
  heritage: <Landmark />,
  museums: <Library />,
  nature: <Mountain />,
  food: <UtensilsCrossed />,
  shopping: <ShoppingBag />,
  entertainment: <Ticket />,
  family: <Users />,
  culture: <Palette />,
};

type CommonProps = {
  place: DestinationCardData;
  /** Opens the destination's detail view */
  onOpen: (id: string) => void;
  /** Accessible label for the open action, e.g. "View details: Masmak Fortress" */
  openLabel: string;
  /** Secondary contextual action (e.g. "Add to plan"), rendered above the stretched link */
  action?: ReactNode;
  className?: string;
};

/**
 * Featured destination: large editorial card with the title over the media. A bottom scrim is used
 * only here, because text sits on the image. Placeholder caption moves to the top.
 */
export function FeaturedDestinationCard({ place, onOpen, openLabel, action, className }: CommonProps) {
  return (
    <Card interactive className={cn('h-full min-h-[18rem] rounded-xl border-0 shadow-md', className)}>
      <PlacePhoto
        photo={place.photo}
        label={place.name}
        tone={CATEGORY_TONE[place.category]}
        icon={CATEGORY_ICON[place.category]}
        iconSize="lg"
        captionPlacement="top"
        sizes="(min-width: 768px) 66vw, 82vw"
        className="absolute inset-0 -z-10 size-full"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/75 via-black/25 to-transparent" aria-hidden />
      <div className="mt-auto flex flex-col gap-2 p-5 text-white">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
          <Sparkles className="size-3.5" aria-hidden />
          {place.categoryLabel}
        </span>
        <h3 className="font-display text-2xl leading-tight font-bold [text-wrap:balance]">
          <CardLink onClick={() => onOpen(place.id)} aria-label={openLabel} className="text-white">
            {place.name}
          </CardLink>
        </h3>
        {place.tagline && <p className="line-clamp-2 text-sm text-white/85">{place.tagline}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/85">
            <li className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {place.area}
            </li>
            <li className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {place.duration}
            </li>
          </ul>
          {action && <div className="relative z-10">{action}</div>}
        </div>
      </div>
    </Card>
  );
}

/** Standard destination card: media (4:3) + clear text hierarchy below. */
export function DestinationCard({ place, onOpen, openLabel, action, className }: CommonProps) {
  return (
    <Card interactive className={cn('h-full', className)}>
      <CardMedia
        ratio="landscape"
        overlay={
          <Badge tone="neutral" className="bg-surface/85 border-transparent shadow-sm backdrop-blur-sm">
            <span className="[&_svg]:size-3.5" aria-hidden>
              {CATEGORY_ICON[place.category]}
            </span>
            {place.categoryLabel}
          </Badge>
        }
      >
        <PlacePhoto photo={place.photo} label={place.name} tone={CATEGORY_TONE[place.category]} icon={CATEGORY_ICON[place.category]} />
      </CardMedia>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <CardEyebrow className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden />
          {place.area}
        </CardEyebrow>
        <CardTitle>
          <CardLink onClick={() => onOpen(place.id)} aria-label={openLabel}>
            {place.name}
          </CardLink>
        </CardTitle>
        <CardDescription className="line-clamp-2">{place.summary}</CardDescription>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <CardMeta items={[{ icon: <Clock />, label: place.duration }]} />
          {action && <div className="relative z-10">{action}</div>}
        </div>
      </div>
    </Card>
  );
}

/** Compact category tile — filters Discover by category (toggle). */
export function CategoryTile({
  category,
  label,
  count,
  countLabel,
  selected,
  onToggle,
}: {
  category: DestinationCategory;
  label: string;
  count: number;
  countLabel: string;
  selected: boolean;
  onToggle: (category: DestinationCategory) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(category)}
      className={cn(
        'focus-ring border-border bg-surface flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-start transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:hover:translate-y-0',
        selected ? 'border-primary/50 bg-surface-brand' : 'hover:border-border-strong',
      )}
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-md [&_svg]:size-5',
          selected ? 'bg-primary text-primary-fg' : 'bg-surface-muted text-fg-secondary',
        )}
        aria-hidden
      >
        {CATEGORY_ICON[category]}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-fg truncate text-sm font-bold">{label}</span>
        <span className="type-caption text-fg-muted">{countLabel.replace('#', String(count))}</span>
      </span>
    </button>
  );
}
