import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/features/switch-language';
import { ThemeSwitcher } from '@/features/switch-theme';
import { DemoBadge } from '@/shared/ui';
import { CardsAvatars } from './cards-avatars';
import { ChatPatterns } from './chat-patterns';
import { ComponentsShowcase } from './components-showcase';
import { Foundations } from './foundations';
import { DiscoverPatterns } from './discover-patterns';
import { OverlayPatterns } from './overlay-patterns';
import { ProposalPatterns } from './proposal-patterns';
import { SubscriptionPatterns } from './subscription-patterns';
import { TablePatterns } from './table-patterns';
import { ThemeSurfaces } from './theme-surfaces';
import { TripPatterns } from './trip-patterns';
import { VoiceModePatterns } from './voice-mode-patterns';

const SECTIONS = [
  'brand',
  'colors',
  'surfaces',
  'typography',
  'shape',
  'icons',
  'buttons',
  'forms',
  'tabs',
  'badges',
  'cards',
  'tables',
  'overlays',
  'feedback',
  'navigation',
  'chat',
  'voiceMode',
  'trip',
  'proposal',
  'discover',
  'subscription',
  'overlayPatterns',
] as const;

/** Gate C review page — every foundation and core component in the current language and theme. */
export function DesignSystemGallery() {
  const t = useTranslations('designSystem');
  const title = (id: (typeof SECTIONS)[number]) => {
    switch (id) {
      case 'chat':
        return t('chatPatterns.title');
      case 'overlayPatterns':
        return t('overlayPatterns.title');
      case 'surfaces':
        return t('surfaces.title');
      case 'trip':
        return t('trip.title');
      case 'voiceMode':
        return t('voiceMode.title');
      case 'tables':
        return t('tables.title');
      case 'proposal':
        return t('proposal.sectionTitle');
      case 'discover':
        return t('discoverGrid.title');
      case 'subscription':
        return t('subscription.title');
      default:
        return t(`sections.${id}.title`);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="z-nav border-border bg-nav/85 sticky top-0 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/images/brand/logo.svg" alt="" width={40} height={32} />
            <div className="flex flex-col">
              <h1 className="type-h4 leading-tight">{t('title')}</h1>
              <p className="type-caption text-fg-muted">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
        <nav aria-label={t('sectionsNav')} className="mx-auto max-w-7xl overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6 lg:px-8">
          <ul className="flex gap-1">
            {SECTIONS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="focus-ring text-fg-secondary hover:bg-surface-muted hover:text-fg block rounded-full px-3 py-1.5 text-sm whitespace-nowrap"
                >
                  {title(id)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-aurora border-border bg-surface flex flex-col gap-3 overflow-hidden rounded-xl border p-6 sm:p-8">
          <DemoBadge label={t('reviewBadge')} />
          <p className="type-display">
            <span className="text-brand-gradient">{t('heroTitle')}</span>
          </p>
          <p className="type-body-lg text-fg-secondary max-w-3xl">{t('heroBody')}</p>
        </div>
        <Foundations />
        <ThemeSurfaces />
        <ComponentsShowcase />
        <CardsAvatars />
        <TablePatterns />
        <ChatPatterns />
        <VoiceModePatterns />
        <TripPatterns />
        <ProposalPatterns />
        <DiscoverPatterns />
        <SubscriptionPatterns />
        <OverlayPatterns />
      </main>
    </div>
  );
}
