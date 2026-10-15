'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import { ImagePlaceholder } from '@/shared/ui';
import type { ExpoBooth } from '../model/expo';

/**
 * Pavilion media. The demo pavilions are fictional, so a real photo here is always a theme photo
 * ("illustrative"): it carries a visible "Illustrative photo" chip and, where asked, a credit line
 * that says it is not the pavilion itself. Without a photo → the labelled placeholder.
 */
export function BoothPhoto({ booth, sizes = '(min-width: 1024px) 33vw, 100vw', priority = false, className }: { booth: ExpoBooth; sizes?: string; priority?: boolean; className?: string }) {
  const t = useTranslations('expoMap');
  const locale = useLocale();
  const image = booth.images.find((i) => !i.placeholder && i.src);
  const name = localize(booth.name, locale);
  if (!image) return <ImagePlaceholder label={name} tone="expo" className={className} />;
  return (
    <div className={cn('bg-surface-muted relative overflow-hidden', className)}>
      <Image src={image.src} alt={localize(image.alt, locale)} fill sizes={sizes} priority={priority} className="object-cover" />
      {image.illustrative && (
        <span className="bg-surface/85 text-fg absolute end-2 top-2 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold shadow-sm backdrop-blur-sm">{t('illustrativePhoto')}</span>
      )}
    </div>
  );
}

/** "Illustrative photo of the theme — not this pavilion · Author · License · Wikimedia Commons" */
export function BoothPhotoCredit({ booth, className }: { booth: ExpoBooth; className?: string }) {
  const t = useTranslations('expoMap');
  const image = booth.images.find((i) => !i.placeholder && i.src);
  if (!image?.credit) return null;
  return (
    <p className={cn('type-caption text-fg-muted', className)}>
      {image.illustrative && <>{t('illustrativeNote')} · </>}
      {image.sourceUrl ? (
        <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="focus-ring hover:text-fg rounded-sm underline underline-offset-2" dir="ltr">
          {image.credit}
        </a>
      ) : (
        <span dir="ltr">{image.credit}</span>
      )}
    </p>
  );
}
