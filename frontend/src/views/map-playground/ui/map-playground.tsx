'use client';

import { Landmark } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import { LanguageSwitcher } from '@/features/switch-language';
import { ThemeSwitcher } from '@/features/switch-theme';
import { queryPlaces, usePlaceSearch, type Place } from '@/entities/place';
import { currentStopId, sortedStops, usePlan, type PlanEndpoint } from '@/entities/plan';
import { localize, type Bounds, type LatLng } from '@/shared/api';
import { cn } from '@/shared/lib';
import { MapView, type MapPoi, type MapViewMarker } from '@/shared/map';
import { DemoBadge } from '@/shared/ui';
import { ExpoSiteMap } from '@/widgets/expo-site-map';

/**
 * Dev-only review page for Phase 5 (map foundation): the real tourism map, a plan route and the
 * illustrative Expo layout, each with a synchronized list. Not a product screen.
 */
export function MapPlayground() {
  const t = useTranslations('mapPlayground');
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="type-h1">{t('title')}</h1>
            <DemoBadge label={t('devOnly')} />
          </div>
          <p className="type-body text-fg-secondary max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>
      <TourismSection />
      <RouteSection />
      <ExpoSection />
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="type-h3">{title}</h2>
        <p className="type-caption text-fg-muted max-w-3xl">{hint}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">{children}</div>
    </section>
  );
}

/** List kept in sync with the map selection (the accessible alternative to the canvas). */
function SyncedList({ label, items, selectedId, onSelect }: { label: string; items: { id: string; text: string; sub?: string }[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <ul aria-label={label} className="border-border flex max-h-[26rem] flex-col gap-1 overflow-y-auto rounded-xl border p-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            aria-pressed={item.id === selectedId}
            onClick={() => onSelect(item.id)}
            className={cn(
              'focus-ring hover:bg-surface-muted flex w-full flex-col rounded-md px-3 py-2 text-start',
              item.id === selectedId && 'bg-primary/10 text-primary',
            )}
          >
            <span className="text-sm font-bold">{item.text}</span>
            {item.sub && <span className="type-caption text-fg-muted">{item.sub}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function usePlaces(): Place[] {
  const locale = useLocale();
  const { data } = usePlaceSearch({ locale, pageSize: 100 });
  return data?.items ?? [];
}

function TourismSection() {
  const t = useTranslations('mapPlayground');
  const locale = useLocale();
  const places = usePlaces();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [poi, setPoi] = useState<MapPoi | null>(null);

  const markers = useMemo<MapViewMarker[]>(
    () => places.map((p) => ({ id: p.id, position: p.location, label: localize(p.name, locale), kind: 'place', icon: <Landmark /> })),
    [places, locale],
  );
  // "Nearby" = guide places inside the visible map area (real bounds, verified coordinates)
  const inView = bounds ? queryPlaces(places, { locale, bounds, sort: 'name' }) : [];
  const selected = places.find((p) => p.id === selectedId);

  return (
    <Section title={t('tourismTitle')} hint={t('tourismHint')}>
      <div className="flex flex-col gap-3">
        <MapView
          mode="geo"
          label={t('mapLabel.tourism')}
          markers={markers}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setPoi(null);
          }}
          onBoundsChange={setBounds}
          onPoiClick={(p) => {
            setPoi(p);
            setSelectedId(null);
          }}
          className="h-[26rem] rounded-xl border"
        />
        <div aria-live="polite" className="border-border bg-surface rounded-xl border p-4 text-sm">
          {selected ? (
            <div className="flex flex-col gap-1">
              <span className="font-bold">{localize(selected.name, locale)}</span>
              <span className="text-fg-secondary">{localize(selected.summary, locale)}</span>
              <span className="type-caption text-fg-muted" dir="ltr">
                {t('coordinateSource', { source: selected.locationSource })}
              </span>
            </div>
          ) : poi ? (
            <div className="flex flex-col gap-1">
              <span className="type-caption text-fg-muted">{t('poiTitle')}</span>
              <span className="font-bold">{poi.name}</span>
              <span className="text-fg-secondary">
                {poi.category ? `${poi.category} · ` : ''}
                {t('poiNotInGuide')}
              </span>
            </div>
          ) : (
            <span className="text-fg-muted">{t('selectHint')}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold" aria-live="polite">
          {t('inView', { count: inView.length })}
        </p>
        <SyncedList
          label={t('mapLabel.tourism')}
          items={inView.map((p) => ({ id: p.id, text: localize(p.name, locale), sub: localize(p.region.city, locale) }))}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </Section>
  );
}

function RouteSection() {
  const t = useTranslations('mapPlayground');
  const locale = useLocale();
  const places = usePlaces();
  const { data: plan } = usePlan('plan_heritage_day');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { markers, orderLine, items } = useMemo(() => {
    if (!plan || places.length === 0) return { markers: [], orderLine: null, items: [] };
    const byId = new Map(places.map((p) => [p.id, p]));
    const stops = sortedStops(plan).filter((s) => s.ref.kind === 'place' && byId.has(s.ref.placeId));
    const current = currentStopId(plan);
    const result = stops.map((stop, index) => {
      const place = byId.get(stop.ref.kind === 'place' ? stop.ref.placeId : '')!;
      const status = stop.completedAt ? 'completed' : stop.id === current ? 'current' : 'upcoming';
      const name = localize(place.name, locale);
      const label = `${t('stopLabel', { number: index + 1, name })} — ${t(`status.${status}`)}`;
      return { stop, place, status, name, label, number: index + 1 } as const;
    });

    // Start / end points (not numbered, never "completed" — the start is reached once the plan starts)
    const endpoint = (e: PlanEndpoint | undefined): { name: string; position: LatLng } | null => {
      if (!e) return null;
      if (e.kind === 'point') return { name: localize(e.name, locale), position: e.location };
      if (e.kind === 'place') {
        const place = byId.get(e.placeId);
        return place ? { name: localize(place.name, locale), position: place.location } : null;
      }
      return null; // booth endpoints belong to the Expo map
    };
    const start = endpoint(plan.start);
    const end = endpoint(plan.end);
    const startId = `${plan.id}:start`;
    const endId = `${plan.id}:end`;

    const stopMarkers = result.map<MapViewMarker>((r) => ({ id: r.stop.id, position: r.place.location, label: r.label, kind: 'visit', status: r.status, number: r.number }));
    const currentIndex = Math.max(0, result.findIndex((r) => r.status === 'current'));
    return {
      markers: [
        ...(start ? [{ id: startId, position: start.position, label: t('startLabel', { name: start.name }), kind: 'start', status: plan.startedAt ? 'completed' : 'upcoming' } satisfies MapViewMarker] : []),
        ...stopMarkers,
        ...(end ? [{ id: endId, position: end.position, label: t('endLabel', { name: end.name }), kind: 'destination' } satisfies MapViewMarker] : []),
      ],
      // Line: start → stops in visit order → end. Done (solid) up to the current stop.
      orderLine: {
        ids: [...(start ? [startId] : []), ...result.map((r) => r.stop.id), ...(end ? [endId] : [])],
        progressIndex: currentIndex + (start ? 1 : 0),
      },
      items: [
        ...(start ? [{ id: startId, text: `${t('start')} · ${start.name}`, sub: plan.startTime }] : []),
        ...result.map((r) => ({ id: r.stop.id, text: `${r.number}. ${r.name}`, sub: `${r.stop.startTime ?? ''} · ${t(`status.${r.status}`)}` })),
        ...(end ? [{ id: endId, text: `${t('end')} · ${end.name}` }] : []),
      ],
    };
  }, [plan, places, locale, t]);

  return (
    <Section title={t('routeTitle')} hint={t('routeHint')}>
      <MapView
        mode="geo"
        label={t('mapLabel.route')}
        markers={markers}
        orderLine={orderLine}
        selectedId={selectedId}
        onSelect={setSelectedId}
        className="h-[26rem] rounded-xl border"
      />
      <SyncedList label={t('mapLabel.route')} items={items} selectedId={selectedId} onSelect={setSelectedId} />
    </Section>
  );
}

function ExpoSection() {
  const t = useTranslations('mapPlayground');
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="type-h3">{t('expoTitle')}</h2>
        <p className="type-caption text-fg-muted max-w-3xl">{t('expoHint')}</p>
      </div>
      <ExpoSiteMap />
    </section>
  );
}
