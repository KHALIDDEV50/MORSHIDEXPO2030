import { Bell, CalendarDays, Compass, MessageCircle, Ticket, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import { Button, IllustrativeMap, MapPin, RouteMarkerVisual } from '@/shared/ui';
import { DemoBlock, GallerySection } from './section';

const LAYERS = [
  { key: 'canvas', className: 'bg-background' },
  { key: 'nav', className: 'bg-nav' },
  { key: 'chat', className: 'bg-chat' },
  { key: 'card', className: 'bg-surface' },
  { key: 'elevated', className: 'bg-surface-elevated shadow-md' },
  { key: 'floating', className: 'glass shadow-lg' },
] as const;

/** A miniature app frame built only from tokens, rendered in a forced theme. */
function MiniApp({ theme }: { theme: 'light' | 'dark' }) {
  const t = useTranslations('designSystem.surfaces');
  return (
    <div className={cn(theme, 'text-fg overflow-hidden rounded-xl border border-border')} style={{ backgroundImage: 'var(--ambient)' }}>
      <div className="bg-background flex h-[26rem]">
        {/* Navigation rail */}
        <nav aria-label={t('sampleNav')} className="bg-nav border-border flex w-14 shrink-0 flex-col items-center gap-3 border-e py-3">
          <span className="bg-cta text-on-cta grid size-9 place-items-center rounded-lg shadow-glow">
            <MessageCircle className="size-4" aria-hidden />
          </span>
          {[Compass, Ticket, CalendarDays].map((Icon, i) => (
            <span key={i} className="text-fg-muted grid size-9 place-items-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
          ))}
          <span className="text-fg-muted mt-auto grid size-9 place-items-center rounded-lg">
            <User className="size-4" aria-hidden />
          </span>
        </nav>

        {/* Chat surface + card */}
        <div className="bg-chat flex min-w-0 flex-1 flex-col gap-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{t(theme)}</span>
            <span className="border-border bg-surface grid size-8 place-items-center rounded-full border">
              <Bell className="size-4" aria-hidden />
            </span>
          </div>
          <p className="border-arif/45 bg-surface type-body-sm w-fit max-w-[90%] rounded-xl rounded-ss-sm border px-3 py-2 font-normal">{t('sampleChat')}</p>
          <div className="border-border bg-surface rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-bold">{t('sampleCardTitle')}</p>
            <p className="type-caption text-fg-muted">{t('sampleCardMeta')}</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-primary text-primary-fg rounded-full px-2.5 py-0.5 text-xs font-medium">{t('activeState')}</span>
              <span className="bg-primary-tint text-primary glow-blue rounded-full px-2.5 py-0.5 text-xs font-medium">{t('voiceActivity')}</span>
              <span className="bg-surface-muted text-fg-muted rounded-full px-2.5 py-0.5 text-xs font-medium opacity-60">{t('disabled')}</span>
            </div>
          </div>

          {/* Map with floating glass panel + an elevated dialog */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg">
            <IllustrativeMap className="absolute inset-0">
              <MapPin x={20} y={40}>
                <RouteMarkerVisual kind="visit" status="current" number={2} size="sm" />
              </MapPin>
              <MapPin x={40} y={62}>
                <RouteMarkerVisual kind="visit" status="upcoming" number={3} size="sm" />
              </MapPin>
            </IllustrativeMap>
            <div className="glass border-border absolute end-2 top-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-lg">{t('sampleFloating')}</div>
            <div className="border-border bg-surface-elevated absolute start-2 bottom-2 flex items-center gap-2 rounded-lg border p-2 shadow-lg">
              <span className="text-xs font-bold">{t('sampleDialog')}</span>
              <Button size="sm" variant="danger" className="h-7 px-2.5 text-xs" tabIndex={-1}>
                ✕
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeSurfaces() {
  const t = useTranslations('designSystem.surfaces');
  return (
    <GallerySection id="surfaces" title={t('title')} description={t('description')}>
      <DemoBlock label={t('stack')} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(['light', 'dark'] as const).map((theme) => (
          <div key={theme} className={cn(theme, 'bg-background text-fg rounded-xl border border-border p-4')} style={{ backgroundImage: 'var(--ambient)' }}>
            <p className="mb-3 text-sm font-bold">{t(theme)}</p>
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {LAYERS.map((layer, i) => (
                <li key={layer.key} className="flex flex-col gap-1.5">
                  <div className={cn('border-border relative h-16 rounded-lg border', layer.className)} style={{ transform: `translateY(${-i * 2}px)` }} />
                  <span className="type-caption text-fg-secondary leading-tight">{t(`layers.${layer.key}`)}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </DemoBlock>
      <div className="grid gap-4 lg:grid-cols-2">
        <MiniApp theme="light" />
        <MiniApp theme="dark" />
      </div>
    </GallerySection>
  );
}
