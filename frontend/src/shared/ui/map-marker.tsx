import { Check, Coffee, Flag, Footprints } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib';

/** What a stop *is* */
export type RouteStopKind = 'start' | 'visit' | 'break' | 'destination';
/** Where the visitor is with it (overdue = planned time passed, not completed) */
export type RouteStopStatus = 'upcoming' | 'current' | 'completed' | 'overdue';
/** @deprecated kept for older call sites; use RouteStopStatus */
export type MarkerState = RouteStopStatus;

type VisualProps = {
  kind?: RouteStopKind;
  status?: RouteStopStatus;
  /** Sequence number for visit stops */
  number?: number;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  className?: string;
};

const SIZE = {
  sm: 'size-7 text-xs [&_svg]:size-3.5',
  md: 'size-9 text-sm [&_svg]:size-4',
  lg: 'size-11 text-base [&_svg]:size-5',
};

/**
 * The single visual language for itinerary stops (design-system.md "Route & stop states"),
 * shared by the map markers and the trip timeline. Every state pairs color with an icon,
 * shape or badge — never color alone.
 *
 * - start: solid green circle with footprints
 * - destination: ink rounded-square with a flag (different shape from the start)
 * - break: dashed pink circle with a cup
 * - visit: numbered circle (outline = upcoming, gradient + glowing ring = current,
 *   muted + check = completed, amber + "!" badge = overdue)
 */
export function RouteMarkerVisual({
  kind = 'visit',
  status = 'upcoming',
  number,
  size = 'md',
  selected = false,
  className,
}: VisualProps) {
  const isVisit = kind === 'visit';
  const completed = status === 'completed';
  const current = status === 'current';
  const overdue = status === 'overdue';

  return (
    <span
      aria-hidden
      className={cn(
        'relative grid shrink-0 place-items-center border-2 font-bold tabular-nums shadow-sm transition-transform duration-200',
        SIZE[size],
        kind === 'destination' ? 'rounded-[30%]' : 'rounded-full',
        // Kinds
        kind === 'start' && 'bg-success border-transparent text-white',
        kind === 'destination' && 'bg-fg text-background border-transparent',
        kind === 'break' && 'border-accent-pink/60 bg-pink-tint text-accent-pink border-dashed',
        isVisit && !current && !completed && !overdue && 'border-primary bg-surface text-primary',
        // Statuses
        current && (isVisit ? 'bg-cta text-on-cta border-transparent' : ''),
        current && 'glow-pink',
        completed && isVisit && 'border-border-strong bg-surface-muted text-fg-muted',
        completed && !isVisit && 'opacity-70',
        overdue && isVisit && 'border-warning bg-warning-tint text-warning-fg',
        overdue && !isVisit && 'ring-warning ring-2 ring-offset-1 ring-offset-transparent',
        selected && 'ring-focus/45 scale-110 ring-4',
        className,
      )}
    >
      {kind === 'start' ? (
        <Footprints />
      ) : kind === 'destination' ? (
        <Flag />
      ) : kind === 'break' ? (
        <Coffee />
      ) : completed ? (
        <Check strokeWidth={3} />
      ) : (
        number
      )}

      {/* Corner badges for non-visit kinds and for overdue */}
      {completed && !isVisit && (
        <span className="bg-success absolute -end-1 -top-1 grid size-4 place-items-center rounded-full text-white ring-2 ring-surface [&_svg]:size-2.5">
          <Check strokeWidth={3.5} />
        </span>
      )}
      {overdue && (
        <span className="bg-warning absolute -end-1 -top-1 grid size-4 place-items-center rounded-full text-[0.625rem] leading-none font-black text-black ring-2 ring-surface">
          !
        </span>
      )}
      {current && (
        <span className="bg-brand-pink/25 absolute -inset-1.5 -z-10 animate-ping rounded-full motion-reduce:hidden" />
      )}
    </span>
  );
}

type MapMarkerProps = Omit<ComponentProps<'button'>, 'children'> &
  Omit<VisualProps, 'className'> & {
    /** Accessible name, e.g. "Stop 2: Masmak Fortress — current stop" */
    label: string;
  };

/**
 * Map marker = the stop visual inside a real button, so markers are focusable and
 * keyboard-selectable. Used as an HTML marker by the map adapter (Phase 5).
 */
export function MapMarker({ kind, status, number, size, selected = false, label, className, ...props }: MapMarkerProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={cn('focus-ring grid cursor-pointer place-items-center rounded-full hover:[&>span]:scale-110', className)}
      {...props}
    >
      <RouteMarkerVisual kind={kind} status={status} number={number} size={size} selected={selected} />
    </button>
  );
}
