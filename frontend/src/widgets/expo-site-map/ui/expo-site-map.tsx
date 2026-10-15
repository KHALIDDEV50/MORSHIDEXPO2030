'use client';

import { ArrowLeft, BriefcaseMedical, Bus, ChevronDown, Clock, DoorOpen, Info, Layers, Map as MapIcon, MoonStar, Sparkles, Toilet, Utensils } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  BoothPhoto,
  EXPO_SITE,
  expoLocations,
  isThemeZone,
  useBoothSearch,
  useExpoLayout,
  type ExpoConceptImage,
  type ExpoFacilityKind,
  type ExpoLocation,
  type ExpoZone,
} from '@/entities/expo';
import { localize } from '@/shared/api';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { MapView, zoneColor, type LocalLayer, type MapViewMarker } from '@/shared/map';
import { Badge, Button, DemoBadge, ErrorState, Skeleton } from '@/shared/ui';

const FACILITY_ICON: Record<ExpoFacilityKind, ReactNode> = {
  entrance: <DoorOpen />,
  restroom: <Toilet />,
  prayer: <MoonStar />,
  info: <Info />,
  food: <Utensils />,
  firstaid: <BriefcaseMedical />,
  transport: <Bus />,
};

type Selection = { kind: 'zone'; id: string } | { kind: 'location'; id: string } | null;

/**
 * Expo 2030 Riyadh site map (P-023) — the main Expo experience: a full-bleed interactive site
 * plan (MapLibre local mode: pan, zoom, select) organised into four thematic districts — الأرض
 * Earth, التعاون Collaboration, التقنيات Technology, الإنسانيات Humanity — around the central
 * plaza. Zone chips over the map and the zone labels on it select a district, which the camera
 * frames while the others dim; a details panel (end side on desktop, bottom sheet on phones)
 * shows the overview, a district or a location, and "Whole site" returns to the full plan.
 *
 * Everything here is ILLUSTRATIVE demo data in local site-plan coordinates — never mixed with
 * the GPS tourism map — and every image is a labelled concept rendering, not a photograph.
 * The widget fills its parent: give it a height.
 */
export function ExpoSiteMap({
  initialBoothId,
  initialZoneId,
  className,
}: {
  /** Preselect a pavilion ("Show on map") */
  initialBoothId?: string;
  /** Open on one district (framed by the camera); ignored when a pavilion is preselected */
  initialZoneId?: string;
  className?: string;
}) {
  const t = useTranslations('expoMap');
  const locale = useLocale();
  const layoutQuery = useExpoLayout();
  const boothsQuery = useBoothSearch({});
  const [selection, setSelection] = useState<Selection>(initialBoothId ? { kind: 'location', id: initialBoothId } : initialZoneId ? { kind: 'zone', id: initialZoneId } : null);
  // Camera: a zone id frames that zone, null = whole site, undefined = leave the camera alone
  const [frame, setFrame] = useState<string | null | undefined>(initialBoothId ? undefined : initialZoneId);
  const [sheetOpen, setSheetOpen] = useState(true);

  const layout = layoutQuery.data;
  const zones = useMemo(() => [...(layout?.zones ?? [])].sort((a, b) => a.number - b.number), [layout]);
  const themeZones = useMemo(() => zones.filter(isThemeZone), [zones]);
  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);
  const locations = useMemo(() => expoLocations(boothsQuery.data ?? [], layout?.facilities ?? []), [boothsQuery.data, layout]);

  const nameOf = (location: ExpoLocation) => localize(location.type === 'booth' ? location.booth.name : location.facility.name, locale);
  const zoneName = (zone: ExpoZone) => localize(zone.name, locale);

  const localLayer = useMemo<LocalLayer | undefined>(
    () =>
      layout && {
        extent: EXPO_SITE,
        site: layout.site,
        paths: layout.paths,
        zones: zones.map((z) => ({ id: z.id, number: z.number, name: localize(z.name, locale), color: z.color, polygon: z.polygon, labelAt: z.labelAt, kind: z.kind })),
      },
    [layout, zones, locale],
  );

  const markers = useMemo<MapViewMarker[]>(
    () =>
      locations.map((l) => {
        const zone = zoneById.get(l.zoneId);
        return {
          id: l.id,
          position: l.position,
          code: l.number,
          color: zone ? zoneColor(zone.color) : undefined,
          kind: l.type === 'facility' ? 'facility' : 'place',
          icon: l.type === 'facility' ? FACILITY_ICON[l.facility.kind] : undefined,
          label: `${l.number} · ${l.type === 'booth' ? localize(l.booth.name, locale) : localize(l.facility.name, locale)}${zone ? ` — ${t('zoneShort', { number: zone.number, name: localize(zone.name, locale) })}` : ''}`,
        };
      }),
    [locations, zoneById, locale, t],
  );

  const selectedLocation = selection?.kind === 'location' ? locations.find((l) => l.id === selection.id) : undefined;
  const selectedZoneId = selection?.kind === 'zone' ? selection.id : (selectedLocation?.zoneId ?? null);

  const selectZone = (id: string) => {
    setSelection({ kind: 'zone', id });
    setFrame(id);
    setSheetOpen(true);
  };
  const selectLocation = (id: string | null) => {
    setSelection(id ? { kind: 'location', id } : null);
    if (id) setSheetOpen(true);
  };
  const showWholeSite = () => {
    setSelection(null);
    setFrame(null);
  };

  if (layoutQuery.isError || boothsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void layoutQuery.refetch();
          void boothsQuery.refetch();
        }}
        className={className}
      />
    );
  }

  return (
    <div className={cn('border-border relative isolate min-h-[30rem] overflow-hidden rounded-2xl border', className)}>
      {localLayer ? (
        <MapView
          mode="local"
          label={t('mapLabel')}
          localLayer={localLayer}
          markers={markers}
          selectedId={selectedLocation?.id ?? null}
          onSelect={selectLocation}
          selectedZoneId={selectedZoneId}
          onZoneSelect={selectZone}
          focusZoneId={frame}
          fitToMarkers={false}
          className="!absolute inset-0"
        />
      ) : (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}

      {/* Zone switcher over the map (clear of the zoom buttons at the start and the label at the end) */}
      <div className="pointer-events-none absolute inset-x-3 top-14 z-20 flex ps-12 sm:top-3 sm:pe-56">
        <div role="group" aria-label={t('zonesLabel')} className="glass border-border pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full border p-1 shadow-md [scrollbar-width:none]">
          <ZoneChip active={!selectedZoneId} onClick={showWholeSite} icon={<Layers />}>
            {t('wholeSite')}
          </ZoneChip>
          {themeZones.map((zone) => (
            <ZoneChip key={zone.id} active={selectedZoneId === zone.id} onClick={() => selectZone(zone.id)} color={zoneColor(zone.color)}>
              {zoneName(zone)}
            </ZoneChip>
          ))}
        </div>
      </div>

      {/* Details: end-side panel on wide screens, bottom sheet on phones */}
      <section
        aria-live="polite"
        aria-label={t('detailsLabel')}
        className={cn(
          'glass border-border absolute inset-x-2 bottom-2 z-20 flex flex-col overflow-hidden rounded-2xl border shadow-lg',
          'md:inset-x-auto md:end-3 md:top-16 md:bottom-3 md:w-[22rem]',
          sheetOpen ? 'max-h-[52%] md:max-h-none' : 'max-h-14 md:max-h-none',
        )}
      >
        <button
          type="button"
          onClick={() => setSheetOpen((o) => !o)}
          aria-expanded={sheetOpen}
          className="focus-ring text-fg-secondary flex h-10 shrink-0 items-center justify-center gap-1.5 text-xs font-bold md:hidden"
        >
          <span aria-hidden className="bg-border-strong h-1 w-8 rounded-full" />
          <span className="sr-only">{sheetOpen ? t('collapseDetails') : t('expandDetails')}</span>
          <ChevronDown className={cn('size-4 transition-transform', !sheetOpen && 'rotate-180')} aria-hidden />
        </button>
        {/* Keyed by the selection so each view opens scrolled to the top */}
        <div key={selection ? `${selection.kind}:${selection.id}` : 'overview'} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 md:pt-4">
          {selection?.kind === 'location' && selectedLocation ? (
            <LocationDetails location={selectedLocation} zone={zoneById.get(selectedLocation.zoneId)} nameOf={nameOf} zoneName={zoneName} onBack={() => selectZone(selectedLocation.zoneId)} onWholeSite={showWholeSite} />
          ) : selection?.kind === 'zone' && zoneById.get(selection.id) ? (
            <ZoneDetails zone={zoneById.get(selection.id)!} locations={locations.filter((l) => l.zoneId === selection.id)} nameOf={nameOf} zoneName={zoneName} onSelectLocation={selectLocation} onWholeSite={showWholeSite} />
          ) : (
            <Overview zones={zones} locations={locations} images={layout?.overviewImages ?? []} zoneName={zoneName} onZone={selectZone} />
          )}
        </div>
      </section>
    </div>
  );
}

function ZoneChip({ active, onClick, color, icon, children }: { active: boolean; onClick: () => void; color?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={color ? ({ '--zone-color': color } as CSSProperties) : undefined}
      className={cn(
        'focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-bold whitespace-nowrap transition-colors [&_svg]:size-4',
        active ? 'bg-fg text-background' : 'text-fg-secondary hover:bg-surface-muted hover:text-fg',
      )}
    >
      {color ? <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-[var(--zone-color)] ring-2 ring-[color-mix(in_oklab,var(--zone-color)_35%,transparent)]" /> : icon}
      {children}
    </button>
  );
}

function ZoneBadge({ zone, size = 'md' }: { zone: Pick<ExpoZone, 'number' | 'color'>; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      style={{ '--zone-color': zoneColor(zone.color) } as CSSProperties}
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-[var(--zone-color)] font-bold text-white tabular-nums [text-shadow:0_0_2px_rgb(0_0_0/0.45)]',
        size === 'sm' ? 'size-5 text-[0.6875rem]' : 'size-7 text-sm',
      )}
    >
      {zone.number}
    </span>
  );
}

/** A concept rendering, always labelled as such (never presented as a photograph or official plan). */
function ConceptImage({ image, className, note }: { image?: ExpoConceptImage; className?: string; note: string }) {
  const t = useTranslations('expoMap');
  const locale = useLocale();
  const [failed, setFailed] = useState(false);
  if (!image || failed) {
    return (
      <div className={cn('bg-surface-muted text-fg-muted grid place-items-center rounded-xl', className)} aria-hidden>
        <MapIcon className="size-6" />
      </div>
    );
  }
  return (
    <figure className="flex flex-col gap-1.5">
      <div className={cn('bg-surface-muted relative overflow-hidden rounded-xl', className)}>
        <Image src={image.src} alt={localize(image.alt, locale)} fill sizes="(min-width: 768px) 22rem, 100vw" className="object-cover" onError={() => setFailed(true)} />
        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.6875rem] font-bold text-white backdrop-blur-sm">
          <Sparkles className="size-3" aria-hidden />
          {t('conceptRendering')}
        </span>
      </div>
      <figcaption className="type-caption text-fg-muted">{note}</figcaption>
    </figure>
  );
}

function Overview({ zones, locations, images, zoneName, onZone }: { zones: ExpoZone[]; locations: ExpoLocation[]; images: ExpoConceptImage[]; zoneName: (z: ExpoZone) => string; onZone: (id: string) => void }) {
  const t = useTranslations('expoMap');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="type-h4">{t('overviewTitle')}</h3>
        <p className="text-fg-secondary text-sm">{t('overviewBody')}</p>
      </div>
      <ConceptImage image={images[0]} note={t('conceptNoteSite')} className="aspect-[16/9]" />
      <ul aria-label={t('zonesLabel')} className="flex flex-col gap-1">
        {zones.map((zone) => {
          const count = locations.filter((l) => l.zoneId === zone.id && l.type === 'booth').length;
          return (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => onZone(zone.id)}
                aria-label={t('zoneShort', { number: zone.number, name: zoneName(zone) })}
                className="focus-ring hover:bg-surface-muted flex w-full items-start gap-3 rounded-xl p-2 text-start transition-colors"
              >
                <ZoneBadge zone={zone} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    {zoneName(zone)}
                    {zone.kind === 'hub' && <span className="text-fg-muted text-[0.6875rem] font-medium">{t('hubTag')}</span>}
                  </span>
                  <span className="text-fg-secondary line-clamp-2 text-xs">{localize(zone.summary, locale)}</span>
                </span>
                <span className="text-fg-muted shrink-0 text-xs tabular-nums">{t('pavilionCount', { count })}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="border-border text-fg-secondary flex items-start gap-2 border-t pt-3 text-xs">
        <MapIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          {t('separateFromTourism')}{' '}
          <Link href="/chat?view=map" className="text-primary font-bold underline-offset-2 hover:underline">
            {t('openTourismMap')}
          </Link>
        </span>
      </p>
    </div>
  );
}

function ZoneDetails({
  zone,
  locations,
  nameOf,
  zoneName,
  onSelectLocation,
  onWholeSite,
}: {
  zone: ExpoZone;
  locations: ExpoLocation[];
  nameOf: (l: ExpoLocation) => string;
  zoneName: (z: ExpoZone) => string;
  onSelectLocation: (id: string) => void;
  onWholeSite: () => void;
}) {
  const t = useTranslations('expoMap');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-4">
      <BackButton onClick={onWholeSite}>{t('wholeSite')}</BackButton>
      <div className="flex items-center gap-2.5">
        <ZoneBadge zone={zone} />
        <div className="flex min-w-0 flex-col">
          <h3 className="type-h3">{zoneName(zone)}</h3>
          <span className="type-caption text-fg-muted">{zone.kind === 'hub' ? t('hubTag') : t('themeTag')}</span>
        </div>
      </div>
      <p className="text-fg-secondary text-sm">{localize(zone.summary, locale)}</p>
      <ConceptImage image={zone.image} note={t('conceptNoteZone')} className="aspect-[4/3]" />
      <p className="type-caption text-fg-muted">{t('locationCount', { count: locations.length })}</p>
      <ul className="flex flex-col gap-0.5">
        {locations.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onSelectLocation(l.id)} className="focus-ring hover:bg-surface-muted flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start text-sm">
              <span dir="ltr" className="text-fg-muted w-8 shrink-0 text-xs font-bold tabular-nums">
                {l.number}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{nameOf(l)}</span>
              {l.type === 'facility' ? (
                <span className="text-fg-muted [&_svg]:size-3.5" aria-hidden>
                  {FACILITY_ICON[l.facility.kind]}
                </span>
              ) : (
                <span className="text-fg-muted shrink-0 text-[0.6875rem]">{t(`category.${l.booth.category}`)}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LocationDetails({
  location,
  zone,
  nameOf,
  zoneName,
  onBack,
  onWholeSite,
}: {
  location: ExpoLocation;
  zone?: ExpoZone;
  nameOf: (l: ExpoLocation) => string;
  zoneName: (z: ExpoZone) => string;
  onBack: () => void;
  onWholeSite: () => void;
}) {
  const t = useTranslations('expoMap');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {zone && <BackButton onClick={onBack}>{zoneName(zone)}</BackButton>}
        <button type="button" onClick={onWholeSite} className="focus-ring text-fg-muted hover:text-fg rounded-sm text-xs font-bold">
          {t('wholeSite')}
        </button>
      </div>
      <div className="flex items-start gap-2.5">
        <span
          dir="ltr"
          style={{ '--zone-color': zone ? zoneColor(zone.color) : undefined } as CSSProperties}
          className="grid h-8 min-w-8 shrink-0 place-items-center rounded-full border-2 border-[var(--zone-color)] px-1 text-xs font-bold tabular-nums"
        >
          {location.number}
        </span>
        <div className="flex min-w-0 flex-col">
          <h3 className="type-h3">{nameOf(location)}</h3>
          {zone && <span className="type-caption text-fg-muted">{t('zoneShort', { number: zone.number, name: zoneName(zone) })}</span>}
        </div>
      </div>
      {location.type === 'booth' ? (
        <>
          <BoothPhoto booth={location.booth} sizes="22rem" className="aspect-[16/9] rounded-xl" />
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{t(`category.${location.booth.category}`)}</Badge>
            <DemoBadge label={t('demoData')} />
          </div>
          <p className="text-fg-secondary text-sm">{localize(location.booth.summary, locale)}</p>
          {location.booth.activities.map((activity, i) => (
            <p key={i} className="flex items-center gap-1.5 text-sm">
              <Clock className="text-fg-muted size-4" aria-hidden />
              <span className="font-medium">{localize(activity.title, locale)}</span>
              {activity.time && <span className="text-fg-muted">· {t('demoTime', { time: activity.time })}</span>}
            </p>
          ))}
          <p className="type-caption text-fg-muted">{t('duration', { minutes: location.booth.suggestedDurationMin })}</p>
          <Button asChild size="sm" variant="secondary" className="w-fit">
            <Link href={`/expo/${location.booth.id}`}>{t('viewPavilion')}</Link>
          </Button>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral" className="gap-1 [&_svg]:size-3.5">
            {FACILITY_ICON[location.facility.kind]}
            {t(`facility.${location.facility.kind}`)}
          </Badge>
          <DemoBadge label={t('demoData')} />
        </div>
      )}
      <p className="type-caption text-fg-muted">{t('noNavigation')}</p>
    </div>
  );
}

function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="focus-ring text-primary inline-flex w-fit items-center gap-1 rounded-sm text-xs font-bold hover:underline">
      <ArrowLeft className="flip-rtl size-3.5" aria-hidden />
      {children}
    </button>
  );
}
