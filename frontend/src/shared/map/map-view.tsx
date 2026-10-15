'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

import { MapPinned, TriangleAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Bounds, LatLng } from '@/shared/api';
import { getDirection, type Locale } from '@/shared/config';
import { cn } from '@/shared/lib';
import { DemoBadge, MapMarker, Skeleton, type RouteStopKind, type RouteStopStatus } from '@/shared/ui';
import { getMapAdapter } from './adapter';
import type { LocalLayer, MapInstance, MapMode, MapPoi, MapPosition, MapTheme, MarkerAnchor, OrderLine } from './types';

export type MapViewMarker = {
  id: string;
  position: MapPosition;
  /** Accessible name, e.g. "Stop 2: Masmak Fortress — current stop" */
  label: string;
  /** Route stops use the shared stop visuals; `place` / `facility` use `icon` */
  kind?: RouteStopKind | 'place' | 'facility';
  status?: RouteStopStatus;
  number?: number;
  icon?: ReactNode;
  /** Short visible code drawn on the marker, e.g. "3.2" (Expo locations); must match the list */
  code?: string;
  /** Accent color (hex) for coded markers, e.g. the zone color */
  color?: string;
};

type MapViewProps = {
  mode: MapMode;
  markers: MapViewMarker[];
  /** Accessible name of the map region, e.g. "Map of your plan" */
  label: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  orderLine?: OrderLine | null;
  /** Required in `local` mode (Expo site plan) */
  localLayer?: LocalLayer;
  onBoundsChange?: (bounds: Bounds) => void;
  onPoiClick?: (poi: MapPoi) => void;
  /** Local mode: highlighted zone, and zone clicks (polygon or label) */
  selectedZoneId?: string | null;
  /**
   * Local mode camera: a zone id frames that zone, `null` returns to the whole site, `undefined`
   * leaves the camera alone (default). Applied whenever the value changes.
   */
  focusZoneId?: string | null;
  onZoneSelect?: (zoneId: string) => void;
  /** Fit the camera to the markers whenever the set of marker ids changes (default true) */
  fitToMarkers?: boolean;
  center?: LatLng;
  zoom?: number;
  className?: string;
};

type MountResult = { token: string; instance: MapInstance | null };

const NO_ELEMENTS: ReadonlyMap<string, HTMLElement> = new Map();
const noopSubscribe = () => () => {};

/**
 * Interactive map (D-023) behind the provider-agnostic adapter. Markers are real buttons
 * (keyboard-selectable, announced by name) rendered with the shared stop visuals. Expo
 * (`local` mode) always shows a permanent "illustrative" label. If the map cannot render (no
 * WebGL2, offline), a plain list of the same markers is shown instead.
 */
export function MapView({
  mode,
  markers,
  label,
  selectedId = null,
  onSelect,
  orderLine = null,
  localLayer,
  onBoundsChange,
  onPoiClick,
  selectedZoneId = null,
  focusZoneId,
  onZoneSelect,
  fitToMarkers = true,
  center,
  zoom,
  className,
}: MapViewProps) {
  const t = useTranslations('map');
  const locale = useLocale() as Locale;
  const { resolvedTheme } = useTheme();
  const theme: MapTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const containerRef = useRef<HTMLDivElement>(null);

  // WebGL2 support is only known in the browser (the server renders the loading state)
  const supported = useSyncExternalStore(noopSubscribe, () => getMapAdapter().isSupported(), () => true);

  // Each mount attempt has a token; status is derived from the result for the current token
  const [attempt, setAttempt] = useState(0);
  const token = `${mode}|${locale}|${attempt}`;
  const [result, setResult] = useState<MountResult | null>(null);
  const instance = result?.token === token ? result.instance : null;
  const status = !supported ? 'unsupported' : result?.token !== token ? 'loading' : instance ? 'ready' : 'error';

  // Latest callbacks and initial camera/theme, without re-mounting the map
  const latest = useRef({ onSelect, onBoundsChange, onPoiClick, onZoneSelect, theme, localLayer, center, zoom, label });
  useLayoutEffect(() => {
    latest.current = { onSelect, onBoundsChange, onPoiClick, onZoneSelect, theme, localLayer, center, zoom, label };
  });

  // ───── Mount / unmount (per mode, locale and retry) ─────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !supported) return;
    let cancelled = false;
    let mounted: MapInstance | null = null;
    const unsubscribes: (() => void)[] = [];
    const init = latest.current;

    getMapAdapter()
      .mount(container, {
        mode,
        theme: init.theme,
        locale,
        dir: getDirection(locale),
        localLayer: init.localLayer,
        center: init.center,
        zoom: init.zoom,
        reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
        controlLabels: {
          'NavigationControl.ZoomIn': t('zoomIn'),
          'NavigationControl.ZoomOut': t('zoomOut'),
          'AttributionControl.ToggleAttribution': t('toggleAttribution'),
          // The canvas is its own focusable region (keyboard pan/zoom) — give it a distinct name
          'Map.Title': t('canvasLabel', { label: init.label }),
        },
      })
      .then((created) => {
        if (cancelled) {
          created.destroy();
          return;
        }
        mounted = created;
        unsubscribes.push(
          created.on('boundsChange', (b) => latest.current.onBoundsChange?.(b)),
          created.on('poiClick', (poi) => latest.current.onPoiClick?.(poi)),
          created.on('backgroundClick', () => latest.current.onSelect?.(null)),
          created.on('zoneClick', (zoneId) => latest.current.onZoneSelect?.(zoneId)),
        );
        setResult({ token, instance: created });
      })
      .catch(() => {
        if (!cancelled) setResult({ token, instance: null });
      });

    return () => {
      cancelled = true;
      unsubscribes.forEach((u) => u());
      mounted?.destroy();
    };
    // `t` is stable per locale; everything else is read from `latest` or applied incrementally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, supported]);

  // ───── Markers (containers come from the adapter; React renders buttons into them) ─────
  const anchors = useMemo<MarkerAnchor[]>(() => markers.map(({ id, position }) => ({ id, position })), [markers]);
  const idsKey = markers.map((m) => m.id).join('|');

  const subscribeMarkers = useCallback((cb: () => void) => (instance ? instance.on('markers', cb) : () => {}), [instance]);
  const elements = useSyncExternalStore(subscribeMarkers, () => instance?.getMarkerElements() ?? NO_ELEMENTS, () => NO_ELEMENTS);

  useEffect(() => {
    instance?.setMarkers(anchors);
  }, [instance, anchors]);

  useEffect(() => {
    if (fitToMarkers) instance?.fitTo();
  }, [instance, idsKey, fitToMarkers]);

  useEffect(() => {
    instance?.setSelected(selectedId);
  }, [instance, selectedId, elements]);

  useEffect(() => {
    instance?.setOrderLine(orderLine);
  }, [instance, orderLine, elements]);

  useEffect(() => {
    instance?.setTheme(theme);
  }, [instance, theme]);

  useEffect(() => {
    if (localLayer) instance?.setLocalLayer(localLayer);
  }, [instance, localLayer]);

  useEffect(() => {
    instance?.setSelectedZone(selectedZoneId);
  }, [instance, selectedZoneId, localLayer]);

  // Frame the chosen zone (or the whole site) — only when the caller controls the camera
  useEffect(() => {
    if (focusZoneId !== undefined) instance?.focusZone(focusZoneId);
  }, [instance, focusZoneId]);

  // Focus must never scroll the clipped container (that would desync the canvas)
  const resetScroll = () => {
    const el = containerRef.current;
    if (el && (el.scrollTop || el.scrollLeft)) {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    }
  };

  const unavailable = status === 'unsupported' || status === 'error';

  return (
    <div className={cn('morshid-map bg-surface-muted relative isolate overflow-hidden', className)}>
      <div
        ref={containerRef}
        role="region"
        aria-label={label}
        aria-busy={status === 'loading'}
        onScroll={resetScroll}
        // Inline on purpose: MapLibre adds `.maplibregl-map { position: relative }` from its own
        // (unlayered) stylesheet, which beats Tailwind's layered `absolute inset-0` utilities in
        // production CSS order — the container then collapsed to 0 px height and the map looked
        // empty. An inline style always wins, so the map fills its parent.
        style={{ position: 'absolute', inset: 0 }}
        className={cn(unavailable && 'hidden')}
      />

      {instance &&
        markers.map((marker) => {
          const element = elements.get(marker.id);
          if (!element) return null;
          return createPortal(
            <MarkerButton
              marker={marker}
              selected={marker.id === selectedId}
              onSelect={() => latest.current.onSelect?.(marker.id)}
              onFocus={() => {
                resetScroll();
                instance.reveal(marker.id);
              }}
            />,
            element,
            marker.id,
          );
        })}

      {mode === 'local' && <DemoBadge label={t('illustrative')} className="absolute end-3 top-3 z-10 shadow-sm" />}

      {status === 'loading' && (
        <div className="absolute inset-0 z-10 grid place-items-center" aria-hidden>
          <Skeleton className="absolute inset-0 rounded-none" />
          <MapPinned className="text-fg-muted relative size-8" />
        </div>
      )}

      {unavailable && (
        <MapListFallback
          markers={markers}
          selectedId={selectedId}
          onSelect={(id) => latest.current.onSelect?.(id)}
          message={status === 'unsupported' ? t('unsupported') : t('loadError')}
          retryLabel={status === 'error' ? t('retry') : undefined}
          onRetry={() => setAttempt((a) => a + 1)}
          listLabel={t('listLabel', { label })}
        />
      )}
    </div>
  );
}

function MarkerButton({
  marker,
  selected,
  onSelect,
  onFocus,
}: {
  marker: MapViewMarker;
  selected: boolean;
  onSelect: () => void;
  onFocus: () => void;
}) {
  const { kind = 'place' } = marker;
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation(); // not a background click
    onSelect();
  };

  if (marker.code) {
    const facility = kind === 'facility';
    return (
      <button
        type="button"
        aria-label={marker.label}
        aria-pressed={selected}
        title={marker.label}
        onClick={handleClick}
        onFocus={onFocus}
        style={{ '--marker-color': marker.color ?? 'var(--primary)' } as CSSProperties}
        className={cn(
          'morshid-coded-marker focus-ring flex cursor-pointer items-center gap-1 rounded-full border-2 font-bold tabular-nums shadow-sm transition-transform duration-200 hover:scale-110',
          facility ? 'is-facility' : 'is-place',
          selected && 'is-selected scale-110',
        )}
      >
        {facility && marker.icon && (
          <span aria-hidden className="grid place-items-center [&_svg]:size-3">
            {marker.icon}
          </span>
        )}
        <span aria-hidden dir="ltr">
          {marker.code}
        </span>
      </button>
    );
  }

  if (kind === 'place' || kind === 'facility') {
    const facility = kind === 'facility';
    return (
      <button
        type="button"
        aria-label={marker.label}
        aria-pressed={selected}
        title={marker.label}
        onClick={handleClick}
        onFocus={onFocus}
        className={cn(
          'focus-ring grid cursor-pointer place-items-center border-2 shadow-sm transition-transform duration-200 hover:scale-110',
          facility
            ? 'border-border-strong bg-surface text-fg-secondary size-7 rounded-md [&_svg]:size-3.5'
            : 'border-surface bg-primary text-primary-fg size-9 rounded-full [&_svg]:size-4',
          selected && 'ring-focus/45 scale-110 ring-4',
        )}
      >
        <span aria-hidden className="contents">
          {marker.icon ?? <MapPinned />}
        </span>
      </button>
    );
  }

  return (
    <MapMarker
      kind={kind}
      status={marker.status}
      number={marker.number}
      selected={selected}
      label={marker.label}
      onClick={handleClick}
      onFocus={onFocus}
    />
  );
}

/** Shown when the map can't render: the same markers as a plain, selectable list. */
function MapListFallback({
  markers,
  selectedId,
  onSelect,
  message,
  retryLabel,
  onRetry,
  listLabel,
}: {
  markers: MapViewMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  message: string;
  retryLabel?: string;
  onRetry: () => void;
  listLabel: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col gap-3 overflow-y-auto p-4">
      <div role="status" className="border-border bg-surface flex items-start gap-2 rounded-lg border p-3 text-sm">
        <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="flex flex-1 flex-col gap-2">
          <p>{message}</p>
          {retryLabel && (
            <button type="button" onClick={onRetry} className="focus-ring text-primary self-start rounded-sm font-bold underline-offset-4 hover:underline">
              {retryLabel}
            </button>
          )}
        </div>
      </div>
      {markers.length > 0 && (
        <ul aria-label={listLabel} className="flex flex-col gap-1.5">
          {markers.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                aria-pressed={m.id === selectedId}
                onClick={() => onSelect(m.id)}
                className={cn(
                  'focus-ring border-border bg-surface hover:bg-surface-muted w-full rounded-md border px-3 py-2 text-start text-sm',
                  m.id === selectedId && 'border-primary bg-primary/5',
                )}
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
