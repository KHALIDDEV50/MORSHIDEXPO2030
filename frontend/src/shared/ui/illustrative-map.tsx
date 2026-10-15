import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { DemoBadge } from './badge';

/**
 * Stand-in map used until the real MapLibre map (Phase 5, D-023).
 * Positions are illustrative, not geographic, and the canvas always says so.
 */
export function IllustrativeMap({
  children,
  label,
  className,
}: {
  children?: ReactNode;
  /** Visible disclaimer, e.g. "Map preview · illustrative" (omit only inside an already-labelled preview) */
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-surface-muted relative isolate overflow-hidden',
        // Soft "streets and blocks" pattern drawn with gradients (no external tiles)
        '[background-image:linear-gradient(115deg,transparent_47%,var(--border-strong)_47%,var(--border-strong)_49%,transparent_49%),linear-gradient(25deg,transparent_62%,var(--border)_62%,var(--border)_64%,transparent_64%),linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,56px_56px,56px_56px]',
        className,
      )}
    >
      <div className="bg-success/15 absolute start-[8%] top-[12%] -z-10 h-[22%] w-[18%] rounded-2xl" aria-hidden />
      <div className="bg-primary/10 absolute end-[12%] bottom-[18%] -z-10 h-[16%] w-[26%] rounded-full" aria-hidden />
      {label && <DemoBadge label={label} className="absolute end-3 top-3 z-10 shadow-sm" />}
      {children}
    </div>
  );
}

/** Positions a child at percent coordinates measured from the inline-start edge (mirrors in RTL). */
export function MapPin({ x, y, children, className }: { x: number; y: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('absolute z-[1] -translate-1/2 rtl:translate-x-1/2', className)}
      style={{ insetInlineStart: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  );
}

/**
 * Connects stops in itinerary order. The travelled part (up to `progressIndex`) is a solid
 * brand-gradient line; the rest is dashed. It is a visual connector, not a walking route.
 * Coordinates are percent from the inline-start edge, mirrored in RTL like the markers.
 */
export function RouteLine({ points, progressIndex = 0 }: { points: [number, number][]; progressIndex?: number }) {
  const gradientId = useId();
  if (points.length < 2) return null;
  const split = Math.max(0, Math.min(progressIndex, points.length - 1));
  const done = points.slice(0, split + 1);
  const rest = points.slice(split);
  const toAttr = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <svg className="pointer-events-none absolute inset-0 size-full rtl:-scale-x-100" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#59b6f9" />
          <stop offset="1" stopColor="#f842e2" />
        </linearGradient>
      </defs>
      {/* Halo so the line stays visible on both themes */}
      <polyline points={toAttr(points)} fill="none" stroke="var(--surface)" strokeOpacity="0.85" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 7 }} />
      {rest.length > 1 && (
        <polyline points={toAttr(rest)} fill="none" stroke="var(--primary)" strokeOpacity="0.75" strokeDasharray="1.5 1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3, strokeDasharray: '6 7' }} />
      )}
      {done.length > 1 && (
        <polyline points={toAttr(done)} fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 4 }} />
      )}
    </svg>
  );
}
