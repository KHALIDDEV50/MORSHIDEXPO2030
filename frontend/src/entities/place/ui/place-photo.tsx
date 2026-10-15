import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { ImagePlaceholder, type PlaceholderTone } from '@/shared/ui';
import type { PlacePhotoData } from '../model/destination';

/**
 * Destination media: the real, credited photo when the place has one (local /public asset), else
 * the labelled placeholder (D-026). Same box either way, so layouts never shift.
 */
export function PlacePhoto({
  photo,
  label,
  tone,
  icon,
  iconSize,
  captionPlacement,
  sizes = '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
  className,
}: {
  photo?: PlacePhotoData;
  /** Placeholder label (the place name) */
  label: string;
  tone?: PlaceholderTone;
  icon?: ReactNode;
  iconSize?: 'sm' | 'md' | 'lg';
  captionPlacement?: 'bottom' | 'top' | 'none';
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!photo) return <ImagePlaceholder label={label} tone={tone} icon={icon} iconSize={iconSize} captionPlacement={captionPlacement} className={className} />;
  return (
    <div className={cn('bg-surface-muted relative overflow-hidden', className)}>
      <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

/** "Photo: Author · License · Wikimedia Commons", linked to the file page with the license terms. */
export function PhotoCredit({ photo, label, className }: { photo?: PlacePhotoData; label: string; className?: string }) {
  if (!photo?.credit) return null;
  return (
    <p className={cn('type-caption text-fg-muted', className)}>
      {label}{' '}
      {photo.sourceUrl ? (
        <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="focus-ring hover:text-fg rounded-sm underline underline-offset-2" dir="ltr">
          {photo.credit}
        </a>
      ) : (
        <span dir="ltr">{photo.credit}</span>
      )}
    </p>
  );
}
