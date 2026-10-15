import {
  ArrowLeftRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Ticket,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import { DemoBlock, GallerySection } from './section';

type ColorGroupKey = 'surfaces' | 'text' | 'actions' | 'status' | 'characters';

const COLOR_GROUPS: { key: ColorGroupKey; swatches: { token: string; className: string }[] }[] = [
  {
    key: 'surfaces',
    swatches: [
      { token: 'background', className: 'bg-background' },
      { token: 'surface', className: 'bg-surface' },
      { token: 'surface-elevated', className: 'bg-surface-elevated' },
      { token: 'surface-muted', className: 'bg-surface-muted' },
      { token: 'surface-brand', className: 'bg-surface-brand' },
      { token: 'border', className: 'bg-border' },
      { token: 'input-border', className: 'bg-input' },
    ],
  },
  {
    key: 'text',
    swatches: [
      { token: 'fg', className: 'bg-fg' },
      { token: 'fg-secondary', className: 'bg-fg-secondary' },
      { token: 'fg-muted', className: 'bg-fg-muted' },
    ],
  },
  {
    key: 'actions',
    swatches: [
      { token: 'primary', className: 'bg-primary' },
      { token: 'primary-hover', className: 'bg-primary-hover' },
      { token: 'accent-pink', className: 'bg-accent-pink' },
      { token: 'focus', className: 'bg-focus' },
      { token: 'gradient-brand', className: 'bg-brand-gradient' },
      { token: 'gradient-cta', className: 'bg-cta' },
    ],
  },
  {
    key: 'status',
    swatches: [
      { token: 'success', className: 'bg-success' },
      { token: 'warning', className: 'bg-warning' },
      { token: 'error', className: 'bg-error' },
    ],
  },
  {
    key: 'characters',
    swatches: [
      { token: 'arif', className: 'bg-arif' },
      { token: 'arif-tint', className: 'bg-arif-tint' },
      { token: 'roaya', className: 'bg-roaya' },
      { token: 'roaya-tint', className: 'bg-roaya-tint' },
    ],
  },
];

const TYPE_SCALE = ['type-display', 'type-h1', 'type-h2', 'type-h3', 'type-h4', 'type-body-lg', 'type-body', 'type-body-sm', 'type-caption'] as const;

export function Foundations() {
  const t = useTranslations('designSystem');

  return (
    <>
      <GallerySection id="brand" title={t('sections.brand.title')} description={t('sections.brand.description')}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border-border bg-surface flex flex-col items-center justify-center gap-3 rounded-lg border p-6">
            <Image src="/images/brand/logo.svg" alt={t('brand.logoAlt')} width={120} height={97} />
            <p className="type-caption text-fg-muted">logo.svg</p>
          </div>
          <div className="bg-brand-gradient relative flex min-h-40 items-end overflow-hidden rounded-lg p-4">
            <span className="type-body-sm rounded-full bg-black/25 px-3 py-1 text-white">--gradient-brand</span>
          </div>
          <div className="bg-cta relative flex min-h-40 items-end overflow-hidden rounded-lg p-4">
            <span className="type-body-sm text-on-cta rounded-full bg-black/10 px-3 py-1">--gradient-cta</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['arif', 'roaya'] as const).map((id) => (
            <div
              key={id}
              className={cn(
                'bg-aurora border-border relative flex items-center gap-4 overflow-hidden rounded-xl border p-5',
                id === 'arif' ? 'bg-arif-tint' : 'bg-roaya-tint',
              )}
            >
              <Image
                src="/images/brand/swoosh-motif.svg"
                alt=""
                width={544}
                height={224}
                className="pointer-events-none absolute -end-10 top-4 w-72 opacity-60"
              />
              <Image
                src={`/images/characters/${id}-full.png`}
                alt={t(`brand.${id}Alt`)}
                width={120}
                height={190}
                className="animate-float relative h-40 w-auto drop-shadow-lg"
              />
              <div className="relative flex flex-col gap-1">
                <p className={cn('type-h2', id === 'arif' ? 'text-arif-fg' : 'text-roaya-fg')}>{t(`brand.${id}Name`)}</p>
                <p className="type-body-sm text-fg-secondary font-normal">{t(`brand.${id}Accent`)}</p>
              </div>
            </div>
          ))}
        </div>
      </GallerySection>

      <GallerySection id="colors" title={t('sections.colors.title')} description={t('sections.colors.description')}>
        {COLOR_GROUPS.map((group) => (
          <DemoBlock key={group.key} label={t(`colorGroups.${group.key}`)} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {group.swatches.map((swatch) => (
              <div key={swatch.token} className="flex min-w-0 flex-col gap-1.5">
                <div className={cn('border-border h-14 rounded-md border', swatch.className)} />
                <code className="text-fg-secondary truncate text-xs" dir="ltr">
                  --{swatch.token}
                </code>
              </div>
            ))}
          </DemoBlock>
        ))}
      </GallerySection>

      <GallerySection id="typography" title={t('sections.typography.title')} description={t('sections.typography.description')}>
        <DemoBlock label={t('typography.fonts')} className="flex-col items-stretch gap-4">
          {TYPE_SCALE.map((style) => (
            <div key={style} className="border-border flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6">
              <code className="text-fg-muted w-32 shrink-0 text-xs" dir="ltr">
                .{style}
              </code>
              <p className={style}>{style.startsWith('type-h') || style === 'type-display' ? t('typography.headingSample') : t('typography.bodySample')}</p>
            </div>
          ))}
        </DemoBlock>
        <DemoBlock label={t('typography.mixed')}>
          <p className="type-body" dir="auto">
            {t('typography.mixedSample')}
          </p>
        </DemoBlock>
      </GallerySection>

      <GallerySection id="shape" title={t('sections.shape.title')} description={t('sections.shape.description')}>
        <DemoBlock label={t('shape.radius')}>
          {['rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full'].map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <div className={cn('bg-surface-brand border-primary/30 size-16 border', r)} />
              <code className="text-fg-muted text-xs" dir="ltr">
                {r.replace('rounded-', '')}
              </code>
            </div>
          ))}
        </DemoBlock>
        <DemoBlock label={t('shape.elevation')} className="bg-background gap-6">
          {['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-glow'].map((s) => (
            <div key={s} className={cn('bg-surface-elevated grid h-20 w-28 place-items-center rounded-lg', s)}>
              <code className="text-fg-muted text-xs" dir="ltr">
                {s.replace('shadow-', '')}
              </code>
            </div>
          ))}
        </DemoBlock>
        <DemoBlock label={t('shape.spacing')} className="items-end">
          {[4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map((px) => (
            <div key={px} className="flex flex-col items-center gap-1.5">
              <div className="bg-primary/70 w-3 rounded-xs" style={{ height: px }} />
              <code className="text-fg-muted text-xs">{px}</code>
            </div>
          ))}
        </DemoBlock>
      </GallerySection>

      <GallerySection id="icons" title={t('sections.icons.title')} description={t('sections.icons.description')}>
        <DemoBlock label={t('icons.navigation')} className="gap-6">
          {([
            { Icon: MessageCircle, key: 'chat' },
            { Icon: Compass, key: 'discover' },
            { Icon: Ticket, key: 'expo' },
            { Icon: CalendarDays, key: 'plans' },
            { Icon: User, key: 'profile' },
            { Icon: ArrowLeftRight, key: 'switchCharacter' },
          ] as const).map(({ Icon, key }) => (
            <div key={key} className="flex w-20 flex-col items-center gap-2 text-center">
              <Icon className="text-fg size-6" strokeWidth={1.75} aria-hidden />
              <span className="type-caption text-fg-secondary">{t(`icons.names.${key}`)}</span>
            </div>
          ))}
        </DemoBlock>
        <DemoBlock label={t('icons.direction')} className="gap-6">
          {[ChevronLeft, ChevronRight, Send].map((Icon, i) => (
            <Icon key={i} className="flip-rtl text-primary size-6" aria-hidden />
          ))}
          <span className="bg-border h-6 w-px" aria-hidden />
          {[Clock, MapPin, Sparkles].map((Icon, i) => (
            <Icon key={i} className="text-fg-secondary size-6" aria-hidden />
          ))}
          <p className="type-body-sm text-fg-secondary font-normal">{t('icons.directionNote')}</p>
        </DemoBlock>
      </GallerySection>
    </>
  );
}
