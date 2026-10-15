'use client';

import { Landmark, MapPinned, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, type ReactNode } from 'react';
import type { ItineraryProposal, MessageBlock } from '@/entities/conversation';
import { EXPO_SITE } from '@/entities/expo';
import { CATEGORY_ICON } from '@/entities/place';
import { useStopRefs, type ResolvedStop } from '@/features/send-chat-message';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import { MapView, zoneColor, type LocalLayer, type MapViewMarker } from '@/shared/map';
import { Badge } from '@/shared/ui';

/** What the chat map shows: the active proposal, or a recommendations block. */
export type ChatMapSource =
  | { kind: 'proposal'; proposal: ItineraryProposal }
  | { kind: 'recommendations'; items: Extract<MessageBlock, { type: 'recommendations' }>['items'] };

export type ChatMapItem = { id: string; number: number; stop: ResolvedStop };

/** Resolved, numbered items for a source (kept stops in order for proposals). */
export function useChatMapItems(source: ChatMapSource | null): { items: ChatMapItem[]; type: 'tourism' | 'expo' | null } {
  const { resolve } = useStopRefs();
  return useMemo(() => {
    if (!source) return { items: [], type: null };
    const refs =
      source.kind === 'proposal'
        ? source.proposal.stops.filter((s) => s.kept).sort((a, b) => a.order - b.order).map((s) => s.ref)
        : source.items.map((i) => i.ref);
    const items = refs
      .map((ref) => resolve(ref))
      .filter((s): s is ResolvedStop => s !== null)
      .map((stop, i) => ({ id: stop.id, number: i + 1, stop }));
    // Tourism and Expo are never mixed (D-012, PRD §4.1): booths → Expo map
    const type = items.length === 0 ? null : items.every((i) => i.stop.kind === 'booth') ? 'expo' : 'tourism';
    return { items: type === 'tourism' ? items.filter((i) => i.stop.kind === 'place') : items, type };
  }, [source, resolve]);
}

/**
 * Chat map (PRD §4.1): the proposal or recommendations on the tourism map or the illustrative
 * Expo plan — chosen automatically by type — with numbered markers and a dashed visit-order
 * connector for proposals (not a road route). Selection is controlled (synced with the list).
 */
export function ChatMap({
  source,
  selectedId,
  onSelect,
  tourismOnly = false,
  expoNotice,
  className,
}: {
  source: ChatMapSource | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Chat's Map view: always the tourism map — Expo pavilions belong to the Expo Map view */
  tourismOnly?: boolean;
  /** Shown instead of markers when tourismOnly hides an Expo-only source */
  expoNotice?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('chatMap');
  const locale = useLocale();
  const { layout } = useStopRefs();
  const all = useChatMapItems(source);
  const expoHidden = tourismOnly && all.type === 'expo';
  const items = useMemo(() => (expoHidden ? [] : all.items), [expoHidden, all.items]);
  const type = expoHidden ? null : all.type;

  const markers = useMemo<MapViewMarker[]>(
    () =>
      items.map(({ id, number, stop }) =>
        stop.kind === 'booth'
          ? { id, position: stop.position, code: stop.number, color: stop.zone ? zoneColor(stop.zone.color) : undefined, label: t('stopLabel', { number, name: stop.name }), kind: 'place' }
          : source?.kind === 'proposal'
            ? { id, position: stop.position, number, kind: 'visit', status: 'upcoming', label: t('stopLabel', { number, name: stop.name }) }
            : { id, position: stop.position, kind: 'place', icon: CATEGORY_ICON[stop.place.categories[0]!], label: t('stopLabel', { number, name: stop.name }) },
      ),
    [items, source, t],
  );

  const localLayer = useMemo<LocalLayer | undefined>(
    () =>
      layout && {
        extent: EXPO_SITE,
        site: layout.site,
        paths: layout.paths,
        zones: layout.zones.map((z) => ({ id: z.id, number: z.number, name: localize(z.name, locale), color: z.color, polygon: z.polygon, labelAt: z.labelAt })),
      },
    [layout, locale],
  );

  const orderLine = useMemo(() => (source?.kind === 'proposal' && items.length > 1 ? { ids: items.map((i) => i.id), progressIndex: 0 } : null), [source, items]);

  const contextBadge = type && (
    <Badge tone={type === 'expo' ? 'roaya' : 'arif'} className="shadow-sm">
      {type === 'expo' ? <Sparkles aria-hidden /> : <Landmark aria-hidden />}
      {source?.kind === 'proposal' ? t(`context.${type}Proposal`) : t(`context.${type}Recommendations`)}
    </Badge>
  );

  return (
    <div className={cn('relative', className)}>
      {type === 'expo' && localLayer ? (
        <MapView mode="local" label={t('label')} localLayer={localLayer} markers={markers} orderLine={orderLine} selectedId={selectedId} onSelect={onSelect} fitToMarkers={false} className="size-full" />
      ) : (
        <MapView mode="geo" label={t('label')} markers={markers} orderLine={orderLine} selectedId={selectedId} onSelect={onSelect} className="size-full" />
      )}
      {contextBadge && <div className="pointer-events-none absolute start-1/2 top-3 z-10 -translate-x-1/2 rtl:translate-x-1/2">{contextBadge}</div>}
      {expoHidden && expoNotice && <div className="absolute inset-x-0 top-1/3 z-10 flex justify-center px-6">{expoNotice}</div>}
      {!type && !expoHidden && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center px-6">
          <p className="bg-surface/95 border-border flex max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-center text-sm shadow-md">
            <MapPinned className="text-fg-muted size-5 shrink-0" aria-hidden />
            {t('empty')}
          </p>
        </div>
      )}
    </div>
  );
}
