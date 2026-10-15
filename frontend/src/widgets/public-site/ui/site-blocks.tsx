'use client';

import { ArrowRight, CircleCheck, FlaskConical, Hourglass, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Fragment, useId, type CSSProperties, type ReactNode } from 'react';
import { localize } from '@/shared/api';
import type { SiteMedia } from '@/shared/content';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { Reveal, type RevealVariant } from '@/shared/ui';

/*
 * Public website building blocks (P-021/P-022). Everything here uses the warm `.site-public`
 * semantic tokens, so it follows the shared light/dark theme; no forced dark subtrees and no
 * per-section gradients. Brand accents: MORSHID blue and pink. Two Saudi motifs, used sparingly:
 * - the Najdi parapet (triangular crenellations of Diriyah's mud-brick walls) as the top edge
 *   of featured media frames, and the triangular wall vents as the eyebrow mark;
 * - a thin Sadu-weave band (clay / ink / sand) between major moments (hero, footer, closing).
 */

/* ───────────── Motifs ───────────── */

/** Three small triangles — the vents of Najdi mud-brick walls. Decorative. */
export function NajdiVents({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 8" aria-hidden className={cn('h-2 w-[1.625rem] shrink-0', className)}>
      <path d="M0 8 4 0l4 8zM9 8l4-8 4 8zM18 8l4-8 4 8z" fill="currentColor" />
    </svg>
  );
}

/** Thin Sadu-inspired band: alternating clay and ink triangles on sand. Decorative. */
export function SaduBand({ className }: { className?: string }) {
  const id = `sadu-${useId().replace(/:/g, '')}`;
  return (
    <svg aria-hidden className={cn('block h-3 w-full', className)}>
      <defs>
        <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
          <rect width="24" height="12" fill="var(--sand-deep)" />
          <path d="M0 12 6 2l6 10z" fill="var(--clay)" />
          <path d="M12 2h12l-6 10z" fill="var(--fg)" opacity="0.8" />
          <path d="M5 9.5 6 8l1 1.5z" fill="var(--background)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** clip-path for the parapet edge: `teeth` triangles of `depth` px along the top. */
function parapet(teeth: number, depth: number): string {
  const w = 100 / teeth;
  const points = [`0% ${depth}px`];
  for (let i = 0; i < teeth; i++) points.push(`${(i + 0.5) * w}% 0px`, `${(i + 1) * w}% ${depth}px`);
  points.push('100% 100%', '0% 100%');
  return `polygon(${points.join(',')})`;
}

/* ───────────── Text building blocks ───────────── */

/** Section label in MORSHID pink (or blue / muted), marked by the Najdi vents. */
export function Eyebrow({ children, className, tone = 'pink' }: { children: ReactNode; className?: string; tone?: 'pink' | 'blue' | 'muted' }) {
  return (
    <span className={cn('eyebrow inline-flex items-center gap-2', tone === 'pink' && 'text-accent-pink', tone === 'blue' && 'text-primary', tone === 'muted' && 'text-fg-muted', className)}>
      <NajdiVents className="text-clay" />
      {children}
    </span>
  );
}

/** Section opening: eyebrow, editorial title, intro and optional actions. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  actions,
  align = 'start',
  className,
}: {
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <Reveal className={cn('flex flex-col gap-5', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between md:gap-12', className)}>
      <div className={cn('flex max-w-3xl flex-col gap-4', align === 'center' && 'items-center')}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="type-statement text-fg [text-wrap:balance]">
          {title}
        </h2>
        {intro && <p className="type-body-lg text-fg-secondary max-w-[var(--measure)] [text-wrap:pretty]">{intro}</p>}
      </div>
      {actions && <div className={cn('flex shrink-0 flex-wrap gap-2', align === 'center' && 'justify-center')}>{actions}</div>}
    </Reveal>
  );
}

/** Text link with an arrow that nudges forward on hover (direction-aware). */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('group focus-ring text-primary inline-flex items-center gap-1.5 rounded-sm text-sm font-bold', className)}>
      <span className="decoration-accent-pink/60 underline-offset-[6px] group-hover:underline">{children}</span>
      <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
    </Link>
  );
}

/** Staggered headline: each line rises in on load (static for reduced motion). */
export function HeadlineLines({ lines, accent, className, as: Tag = 'h1', id }: { lines: string[]; accent?: number; className?: string; as?: 'h1' | 'h2'; id?: string }) {
  return (
    <Tag id={id} className={cn('type-hero text-fg [text-wrap:balance]', className)}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          <span className={cn('motion-rise block', i === accent && 'text-accent-gradient pb-[0.08em]')} style={{ '--delay': `${120 + i * 140}ms` } as CSSProperties}>
            {line}
          </span>
          {i < lines.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}

/* ───────────── Honesty: what is real, simulated or planned ───────────── */

export type CapabilityStatus = 'live' | 'simulated' | 'planned';

const STATUS: Record<CapabilityStatus, { icon: ReactNode; className: string }> = {
  live: { icon: <CircleCheck aria-hidden />, className: 'bg-success-tint text-success-fg border-success/25' },
  simulated: { icon: <FlaskConical aria-hidden />, className: 'bg-warning-tint text-warning-fg border-warning/30' },
  planned: { icon: <Hourglass aria-hidden />, className: 'bg-surface text-fg-secondary border-border-strong' },
};

export function StatusTag({ status, className }: { status: CapabilityStatus; className?: string }) {
  const t = useTranslations('site.status');
  return (
    <span className={cn('inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 text-[0.6875rem] font-bold [&_svg]:size-3', STATUS[status].className, className)}>
      {STATUS[status].icon}
      {t(`${status}.label`)}
    </span>
  );
}

export function StatusLegend({ className }: { className?: string }) {
  const t = useTranslations('site.status');
  return (
    <dl className={cn('border-border bg-surface grid gap-4 rounded-2xl border p-5 shadow-sm sm:grid-cols-3', className)}>
      {(['live', 'simulated', 'planned'] as const).map((s) => (
        <div key={s} className="flex flex-col gap-1.5">
          <dt>
            <StatusTag status={s} />
          </dt>
          <dd className="type-caption text-fg-secondary">{t(`${s}.body`)}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────── Media ───────────── */

/**
 * A licensed site photo with its credit. `illustrative` photos get a visible chip so nobody
 * mistakes a theme photo or a concept rendering for Expo 2030 Riyadh. `frame="najdi"` gives the
 * photo the parapet top edge (featured media only).
 */
export function MediaImage({
  media,
  sizes = '100vw',
  priority = false,
  className,
  imageClassName,
  credit = 'overlay',
  reveal,
  delay,
  frame = 'plain',
}: {
  media: SiteMedia;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** overlay: a small credit link on the photo · none: the caller shows the credit elsewhere */
  credit?: 'overlay' | 'none';
  reveal?: RevealVariant;
  delay?: number;
  frame?: 'plain' | 'najdi';
}) {
  const locale = useLocale();
  const style = frame === 'najdi' ? { clipPath: parapet(9, 18) } : undefined;
  const content = (
    <>
      <Image src={media.src} alt={localize(media.alt, locale)} fill sizes={sizes} priority={priority} className={cn('object-cover', imageClassName)} />
      {media.illustrative && (
        <span className={cn('bg-ink/75 absolute start-3 z-[1] inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold text-white backdrop-blur-sm', frame === 'najdi' ? 'top-7' : 'top-3')}>
          <Sparkles className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{localize(media.illustrative, locale)}</span>
        </span>
      )}
      {credit === 'overlay' && <MediaCredit media={media} className="absolute end-2 bottom-2 z-[1]" />}
    </>
  );
  // The parapet is clipped on an inner layer so the outer box keeps its rounded corners; the
  // shadow is a drop-shadow, so it follows the crenellated outline instead of a rectangle.
  const najdi = frame === 'najdi';
  const classes = cn('relative', najdi ? 'drop-shadow-[0_18px_28px_var(--media-shadow)]' : 'bg-sand overflow-hidden', className);
  const inner = (
    <div className={cn('absolute inset-0', najdi && 'bg-sand overflow-hidden rounded-[inherit]')} style={style}>
      {content}
    </div>
  );
  if (reveal) {
    return (
      <Reveal variant={reveal} delay={delay} className={classes}>
        {inner}
      </Reveal>
    );
  }
  return <div className={classes}>{inner}</div>;
}

/** Compact credit chip: "© Author · License" linked to the file page with the license. */
export function MediaCredit({ media, className, variant = 'chip' }: { media: SiteMedia; className?: string; variant?: 'chip' | 'text' }) {
  const t = useTranslations('site');
  const classes = cn(
    'max-w-[90%] truncate rounded-full',
    variant === 'chip' ? 'bg-ink/65 px-2 py-0.5 text-[0.625rem] text-white/90 backdrop-blur-sm' : 'type-caption text-fg-muted',
    className,
  );
  // Concept renderings have no public source page: the credit is plain text, not a link
  if (!media.sourceUrl) {
    return (
      <span dir="ltr" title={media.credit} className={classes}>
        {media.credit}
      </span>
    );
  }
  return (
    <a
      href={media.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr"
      title={`${t('photoCredit')} ${media.credit}`}
      className={cn('focus-ring', variant === 'chip' ? 'hover:text-white' : 'hover:text-fg underline underline-offset-2', classes)}
    >
      <span className="sr-only">{t('photoCredit')} </span>© {media.credit.replace(' · Wikimedia Commons', '')}
    </a>
  );
}

/* ───────────── Page structure ───────────── */

/**
 * Opening of every inner public page: editorial, text on the reading side and (optionally) one
 * featured photo in a Najdi frame on the other. Same page ground as the sections — no seam.
 */
export function PageHero({
  eyebrow,
  title,
  titleLines,
  accentLine,
  intro,
  actions,
  media,
  aside,
  children,
  size = 'md',
  labelledBy = 'page-title',
}: {
  eyebrow: ReactNode;
  title?: string;
  titleLines?: string[];
  accentLine?: number;
  intro?: ReactNode;
  actions?: ReactNode;
  media?: SiteMedia;
  aside?: ReactNode;
  children?: ReactNode;
  size?: 'sm' | 'md';
  labelledBy?: string;
}) {
  const side = aside ?? (media && <MediaImage media={media} priority reveal="scale" frame="najdi" sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/5] w-full rounded-b-[2rem] sm:aspect-[5/4] lg:aspect-[4/5]" imageClassName="motion-settle" />);
  return (
    <section aria-labelledby={labelledBy} className="relative">
      <div className={cn('mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6', size === 'md' ? 'pt-28 pb-16 sm:pt-32 lg:pb-24' : 'pt-28 pb-10 sm:pt-32', side && 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16')}>
        <div className="flex flex-col gap-6">
          <Eyebrow className="motion-rise">{eyebrow}</Eyebrow>
          {titleLines ? (
            <HeadlineLines id={labelledBy} lines={titleLines} accent={accentLine} />
          ) : (
            <h1 id={labelledBy} className={cn('motion-rise text-fg [text-wrap:balance]', size === 'md' ? 'type-hero' : 'type-statement')} style={{ '--delay': '120ms' } as CSSProperties}>
              {title}
            </h1>
          )}
          {intro && (
            <p className="motion-rise type-body-lg text-fg-secondary max-w-[var(--measure)] [text-wrap:pretty]" style={{ '--delay': '320ms' } as CSSProperties}>
              {intro}
            </p>
          )}
          {actions && (
            <div className="motion-rise flex flex-wrap gap-3" style={{ '--delay': '440ms' } as CSSProperties}>
              {actions}
            </div>
          )}
          {children}
        </div>
        {side}
      </div>
    </section>
  );
}

/**
 * Full-width section with the shared rhythm. Only two backgrounds exist on the public site:
 * `base` (the page ivory, the default for consecutive sections) and `sand`, reserved for a
 * section with a distinct role (e.g. hospitality, the guides). Never a gradient; both follow the theme.
 */
export function Section({ id, labelledBy, tone = 'base', className, children }: { id?: string; labelledBy?: string; tone?: 'base' | 'sand'; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn('relative scroll-mt-24 py-[var(--section-y)]', tone === 'sand' && 'bg-sand', className)}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6">{children}</div>
    </section>
  );
}

/** The closing invitation, shared by every public page: a sand card with a framed photo. */
export function CtaBand({ title, body, primary, secondary, media }: { title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string }; media?: SiteMedia }) {
  return (
    <section aria-labelledby="cta-title" className="px-4 pt-8 pb-20 sm:px-6 sm:pb-28">
      <Reveal variant="scale" className="bg-sand relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem]">
        <SaduBand />
        <div className={cn('grid items-center gap-8 px-6 py-12 sm:px-12 sm:py-16', media && 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]')}>
          <div className="flex max-w-2xl flex-col gap-5">
            <h2 id="cta-title" className="type-statement [text-wrap:balance]">
              {title}
            </h2>
            <p className="type-body-lg text-fg-secondary">{body}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              <CtaLink href={primary.href} label={primary.label} variant="primary" />
              {secondary && <CtaLink href={secondary.href} label={secondary.label} variant="secondary" />}
            </div>
          </div>
          {media && <MediaImage media={media} frame="najdi" sizes="(min-width: 1024px) 30vw, 100vw" className="hidden aspect-[4/3] rounded-b-[1.5rem] lg:block" />}
        </div>
      </Reveal>
    </section>
  );
}

function CtaLink({ href, label, variant }: { href: string; label: string; variant: 'primary' | 'secondary' }) {
  return (
    <Link
      href={href}
      className={cn(
        'group focus-ring inline-flex h-12 items-center gap-2 rounded-full px-7 text-base font-medium whitespace-nowrap transition-[background-color,box-shadow,opacity] duration-200',
        variant === 'primary' ? 'bg-cta text-on-cta shadow-glow hover:opacity-90' : 'border-border-strong bg-surface text-fg hover:border-fg/40 border',
      )}
    >
      {label}
      <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
    </Link>
  );
}
