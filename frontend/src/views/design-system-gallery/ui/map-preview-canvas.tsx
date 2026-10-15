import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { IllustrativeMap, RouteLine } from '@/shared/ui';

/** Gallery wrapper around the shared illustrative map with the gallery's disclaimer label. */
export function MapPreviewCanvas({ children, className }: { children?: ReactNode; className?: string }) {
  const t = useTranslations('designSystem.mapPreview');
  return (
    <IllustrativeMap label={t('label')} className={className}>
      {children}
    </IllustrativeMap>
  );
}

/** Dashed visit-order connector — kept for the earlier chat/overlay demos. */
export function OrderLine({ points }: { points: [number, number][] }) {
  return <RouteLine points={points} progressIndex={0} />;
}
