import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

/**
 * Category tones keep placeholder grids varied and meaningful (sand for heritage, green for nature …)
 * without any external imagery. Defined with existing tokens + low-alpha hues so both themes work.
 */
const TONES = {
  brand: 'from-surface-brand via-surface-muted to-pink-tint',
  heritage: 'from-[#f6e7cf] via-[#f3dcc0] to-[#e9c9a4] dark:from-[#2a2117] dark:via-[#241c15] dark:to-[#1a1712]',
  nature: 'from-[#e3f3e6] via-[#d8eedc] to-[#c4e4cc] dark:from-[#12261d] dark:via-[#10211b] dark:to-[#0e1a17]',
  modern: 'from-[#e3eefb] via-[#dbe7f8] to-[#cfdcf3] dark:from-[#14213d] dark:via-[#121d36] dark:to-[#10182f]',
  food: 'from-[#fbe6ea] via-[#f8dde3] to-[#f3cbd6] dark:from-[#2b1620] dark:via-[#25141d] dark:to-[#1d1119]',
  culture: 'from-[#efe6fb] via-[#e7dcf8] to-[#dacbf3] dark:from-[#211a3d] dark:via-[#1c1636] dark:to-[#17132e]',
  expo: 'from-[#e1f4f8] via-[#e9e5fb] to-[#fbe3f6] dark:from-[#0f2633] dark:via-[#1b1b3a] dark:to-[#2a1630]',
} as const;

export type PlaceholderTone = keyof typeof TONES;

/**
 * Local, clearly-labeled placeholder for place/booth photos (D-026).
 * Swap-ready: when an approved photo exists, render it instead and keep the same aspect box.
 */
export function ImagePlaceholder({
  icon = <ImageIcon />,
  label,
  tone = 'brand',
  captionPlacement = 'bottom',
  iconSize = 'md',
  className,
}: {
  icon?: ReactNode;
  /** Accessible description of what the real photo will show */
  label: string;
  tone?: PlaceholderTone;
  /** Move the "Placeholder image" caption to the top when text overlays the bottom of the media */
  captionPlacement?: 'bottom' | 'top' | 'none';
  iconSize?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const t = useTranslations('ui');
  return (
    <div
      role="img"
      aria-label={`${label} — ${t('placeholderImage')}`}
      className={cn('relative isolate grid place-items-center overflow-hidden bg-linear-to-br', TONES[tone], className)}
    >
      <Image
        src="/images/brand/swoosh-motif.svg"
        alt=""
        width={544}
        height={224}
        className="pointer-events-none absolute -end-6 bottom-2 -z-10 w-3/4 opacity-35 dark:opacity-25"
      />
      <span
        className={cn(
          'text-fg/30 dark:text-fg/35',
          iconSize === 'sm' && '[&_svg]:size-7',
          iconSize === 'md' && '[&_svg]:size-10',
          iconSize === 'lg' && '[&_svg]:size-14',
        )}
        aria-hidden
      >
        {icon}
      </span>
      {captionPlacement !== 'none' && (
        <span
          className={cn(
            'type-caption text-fg-muted bg-surface/75 absolute start-2 rounded-full px-2 py-0.5 backdrop-blur-sm',
            captionPlacement === 'bottom' ? 'bottom-2' : 'top-2',
          )}
          aria-hidden
        >
          {t('placeholderImage')}
        </span>
      )}
    </div>
  );
}
