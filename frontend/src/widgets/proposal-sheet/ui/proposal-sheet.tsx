'use client';

import { CalendarCheck, Check, Clock, ListChecks, Map as MapIcon, MessageCircle, Pencil, RotateCcw, Route, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import {
  formatDuration,
  hasEditableStops,
  moveProposalStop,
  ProposalSteps,
  removeProposalStop,
  scheduleProposal,
  summarizeProposal,
  type ProposalStopContent,
  type ScheduledProposalStop,
} from '@/entities/plan';
import { useSaveProposal } from '@/features/save-proposal-to-plans';
import { cn } from '@/shared/lib';
import {
  Badge,
  Button,
  DemoBadge,
  EmptyState,
  IllustrativeMap,
  MapPin,
  RouteLine,
  RouteMarkerVisual,
  Sheet,
  SheetContent,
  toast,
} from '@/shared/ui';

export type ProposalMeta = {
  id: string;
  title: string;
  description: string;
  tripType: 'tourism' | 'expo';
  /** e.g. "Half day · Saturday morning" */
  scheduleHint?: string;
  startTime: string;
  /** Estimated minutes between consecutive stops (an estimate, not routing) */
  bufferMin: number;
};

type ProposalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: ProposalMeta;
  stops: ProposalStopContent[];
  /** Label for the illustrative route map */
  mapLabel: string;
  /** Opens chat about a stop / returns to the conversation */
  onAskAbout?: (stopId: string) => void;
  /** Called once the (demo) save completed with the plan id */
  onSaved?: (planId: string) => void;
  /**
   * Real save (Chat): receives the kept stops in their final order and resolves with the plan id
   * (or null on failure). Without it the sheet uses the gallery's in-memory demo save.
   */
  onSave?: (stops: ProposalStopContent[]) => Promise<string | null>;
  /** Already saved (from the stored proposal) — shows the saved state immediately */
  savedPlanId?: string | null;
  /** "Open plan" after saving */
  onOpenPlan?: (planId: string) => void;
  /** Real route map for the current (edited) order; defaults to the illustrative preview */
  renderRouteMap?: (stops: ScheduledProposalStop<ProposalStopContent>[]) => ReactNode;
};

/**
 * Plan Proposal Sheet (P-013): an AI itinerary the user can review, trim and reorder before
 * explicitly saving it (D-021). Bottom sheet on phones, side panel from md up; actions live in a
 * fixed footer outside the scroll area so they never cover the last step.
 */
export function ProposalSheet({
  open,
  onOpenChange,
  meta,
  stops: initial,
  mapLabel,
  onAskAbout,
  onSaved,
  onSave: saveExternally,
  savedPlanId: initialSavedPlanId = null,
  onOpenPlan,
  renderRouteMap,
}: ProposalSheetProps) {
  const t = useTranslations('proposal');
  const tt = useTranslations('trip');
  const [stops, setStops] = useState(initial);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [editing, setEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const demo = useSaveProposal(meta.id);
  const [externalState, setExternalState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [externalPlanId, setExternalPlanId] = useState<string | null>(null);
  const savedPlanId = saveExternally ? (externalPlanId ?? initialSavedPlanId) : demo.savedPlanId;
  const saveState = saveExternally ? (savedPlanId ? 'saved' : externalState) : demo.state;
  const saved = saveState === 'saved';
  const save = async (): Promise<string | null> => {
    if (!saveExternally) return demo.save();
    setExternalState('saving');
    const planId = await saveExternally(stops).catch(() => null);
    setExternalState(planId ? 'idle' : 'error');
    if (planId) setExternalPlanId(planId);
    return planId;
  };

  const scheduled = useMemo(() => scheduleProposal(stops, { startTime: meta.startTime, bufferMin: meta.bufferMin }), [stops, meta.startTime, meta.bufferMin]);
  const summary = useMemo(() => summarizeProposal(scheduled), [scheduled]);
  const empty = !hasEditableStops(stops);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const remove = (id: string) => {
    const index = stops.findIndex((s) => s.id === id);
    const removed = stops[index];
    if (!removed) return;
    setStops((prev) => removeProposalStop(prev, id));
    toast(t('removedToast', { name: removed.name }), {
      action: {
        label: tt('undo'),
        onClick: () =>
          setStops((prev) => {
            if (prev.some((s) => s.id === id)) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          }),
      },
    });
  };

  const onSave = async () => {
    const planId = await save();
    if (planId) {
      setEditing(false);
      toast.success(t('savedToast'), { description: t('savedToastDescription') });
      onSaved?.(planId);
    } else {
      toast.error(t('saveFailed'));
    }
  };

  const routeMap = renderRouteMap ? (
    renderRouteMap(scheduled)
  ) : (
    <IllustrativeMap label={mapLabel} className="h-40 rounded-lg">
      <RouteLine points={scheduled.map((s) => [s.position.x, s.position.y] as [number, number])} progressIndex={0} />
      {scheduled.map((s) => (
        <MapPin key={s.id} x={s.position.x} y={s.position.y}>
          <RouteMarkerVisual kind={s.kind} status="upcoming" number={s.number} size="sm" />
        </MapPin>
      ))}
    </IllustrativeMap>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="responsive"
        title={meta.title}
        description={meta.description}
        footer={
          <div className="flex w-full flex-col gap-2">
            {saved ? (
              <div className="flex items-center gap-2" role="status">
                <span className="bg-success-tint text-success-fg grid size-9 shrink-0 place-items-center rounded-full">
                  <Check className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{t('savedTitle')}</p>
                  <p className="type-caption text-fg-muted">{t('savedDemoNote')}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => (onOpenPlan && savedPlanId ? onOpenPlan(savedPlanId) : toast(t('openPlanToast')))}>
                  <CalendarCheck aria-hidden />
                  {t('openPlan')}
                </Button>
              </div>
            ) : (
              <Button variant="gradient" size="lg" fullWidth loading={saveState === 'saving'} disabled={empty} onClick={onSave}>
                {saveState !== 'saving' && <Sparkles aria-hidden />}
                {saveState === 'saving' ? t('saving') : t('save')}
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setEditing((e) => !e)} disabled={empty || saved} aria-pressed={editing}>
                {editing ? <Check aria-hidden /> : <Pencil aria-hidden />}
                {editing ? t('doneEditing') : t('edit')}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                <MessageCircle aria-hidden />
                {t('continueChatting')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Compact summary */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="primary">
              <ListChecks aria-hidden />
              {t('stopsCount', { count: summary.visits })}
            </Badge>
            <Badge tone="neutral">
              <Clock aria-hidden />
              {formatDuration(tt, summary.totalMinutes)}
            </Badge>
            <Badge tone="neutral">
              <span dir="ltr">
                {summary.startTime}–{summary.endTime}
              </span>
            </Badge>
            <Badge tone={meta.tripType === 'expo' ? 'roaya' : 'arif'}>
              <Route aria-hidden />
              {t(`tripType.${meta.tripType}`)}
            </Badge>
            {meta.scheduleHint && <span className="type-caption text-fg-muted">{meta.scheduleHint}</span>}
          </div>
          <div className="border-accent-pink/25 bg-pink-tint/50 flex items-start gap-2 rounded-md border px-3 py-2">
            <Sparkles className="text-accent-pink mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="type-body-sm text-fg-secondary font-normal">{t('proposalNotice')}</p>
          </div>

          {/* Route preview: always visible on md+, toggle on phones to keep room for the steps */}
          <div className="hidden md:block">{routeMap}</div>
          <div className="md:hidden">
            <Button size="sm" variant="ghost" onClick={() => setShowMap((s) => !s)} aria-expanded={showMap}>
              <MapIcon aria-hidden />
              {showMap ? t('hideRoute') : t('showRoute')}
            </Button>
            {showMap && <div className="mt-2">{routeMap}</div>}
          </div>

          {editing && !empty && (
            <p className="type-caption text-fg-secondary bg-surface-muted rounded-md px-3 py-2" role="status">
              {t('editingHint')}
            </p>
          )}

          {empty ? (
            <EmptyState
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" onClick={() => setStops(initial)}>
                    <RotateCcw aria-hidden />
                    {t('restore')}
                  </Button>
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    <MessageCircle aria-hidden />
                    {t('askForMore')}
                  </Button>
                </div>
              }
            />
          ) : (
            <ProposalSteps
              stops={scheduled}
              expandedIds={expanded}
              editing={editing && !saved}
              onToggleExpanded={toggle}
              onMove={(id, dir) => setStops((prev) => moveProposalStop(prev, id, dir))}
              onRemove={remove}
              onAsk={onAskAbout}
            />
          )}

          <p className={cn('type-caption text-fg-muted flex items-center gap-2')}>
            <DemoBadge />
            {t('estimatesNote')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
