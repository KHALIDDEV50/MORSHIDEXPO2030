import { ArrowUpRight, CircleDashed } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DemoBadge } from '@/shared/ui';

export type PlaceholderSection = 'chat' | 'discover' | 'expo' | 'plans';

const PHASE: Record<PlaceholderSection, number> = { chat: 7, discover: 6, expo: 10, plans: 8 };
const PREVIEW: Record<PlaceholderSection, string> = { chat: 'chat', discover: 'discover', expo: 'voiceMode', plans: 'trip' };

/**
 * Honest stand-in for destinations that are built in later phases (Phase 3 route stubs).
 * It says what's coming and when, and links to the approved component previews in development.
 */
export function SectionPlaceholderView({ section, showPreviewLink }: { section: PlaceholderSection; showPreviewLink: boolean }) {
  const t = useTranslations('placeholder');
  const ts = useTranslations(`sectionsInfo.${section}`);

  return (
    <div className="bg-aurora mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-10 sm:px-6">
      <DemoBadge label={t('badge', { n: PHASE[section] })} />
      <div className="flex flex-col gap-2">
        <h1 className="type-h1">{ts('title')}</h1>
        <p className="type-body-lg text-fg-secondary">{ts('description')}</p>
      </div>
      <div className="border-border bg-surface rounded-xl border p-5">
        <p className="type-h4 mb-3 text-base">{t('whatsComing')}</p>
        <ul className="flex flex-col gap-2.5">
          {(['i1', 'i2', 'i3'] as const).map((k) => (
            <li key={k} className="text-fg-secondary flex items-start gap-2.5 text-[0.9375rem]">
              <CircleDashed className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
              {ts(`items.${k}`)}
            </li>
          ))}
        </ul>
      </div>
      {showPreviewLink && (
        // Plain anchor: the design-system gallery is a dev-only page (D-030)
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a href={`dev/design-system#${PREVIEW[section]}`} className="focus-ring text-primary inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-bold underline-offset-4 hover:underline">
          {t('previewLink')}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </a>
      )}
    </div>
  );
}
