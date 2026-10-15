'use client';

import { ArrowLeftRight, Clock, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useBoothSearch, useExpoLayout } from '@/entities/expo';
import { placeArea, usePlaceSearch } from '@/entities/place';
import { sortedStops, type Plan } from '@/entities/plan';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { Badge, Button, DemoBadge, Dialog, DialogContent, Skeleton, toast } from '@/shared/ui';
import { boothAlternatives, placeAlternatives, planRefIds, replaceStopInputs, type StopAlternative } from '../model/replace-stop';
import { usePlanActions } from '../model/use-plan-actions';

type Option = StopAlternative & { name: string; category: string; area: string };

/**
 * Replace one itinerary step with a suitable alternative (DEMO): suggestions are ranked from the
 * guide data (category, area or zone, location) — clearly not an AI request. Saving swaps only
 * that step; the rest of the plan keeps its order, times and progress. Undo restores it.
 */
export function ReplaceStopDialog({ plan, stopId, onClose }: { plan: Plan; stopId: string | null; onClose: () => void }) {
  const t = useTranslations('managePlan.replace');
  const tc = useTranslations('discover.categories');
  const te = useTranslations('expoMap');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const places = usePlaceSearch({ locale, pageSize: 100 });
  const booths = useBoothSearch({});
  const layout = useExpoLayout();
  const { replaceStop, restoreStops } = usePlanActions();
  const [choice, setChoice] = useState<string | null>(null);

  const stop = stopId ? plan.stops.find((s) => s.id === stopId) : undefined;

  const { currentName, options } = useMemo(() => {
    if (!stop) return { currentName: '', options: [] as Option[] };
    const exclude = planRefIds(plan);
    const zones = new Map((layout.data?.zones ?? []).map((z) => [z.id, z]));
    if (stop.ref.kind === 'place') {
      const all = places.data?.items ?? [];
      const ref = stop.ref;
      const current = all.find((p) => p.id === ref.placeId);
      if (!current) return { currentName: '', options: [] as Option[] };
      const byId = new Map(all.map((p) => [p.id, p]));
      return {
        currentName: localize(current.name, locale),
        options: placeAlternatives(current, all, exclude).map((a) => {
          const p = byId.get(a.id)!;
          return { ...a, name: localize(p.name, locale), category: tc(p.categories[0]!), area: placeArea(p, locale) };
        }),
      };
    }
    const all = booths.data ?? [];
    const ref = stop.ref;
    const current = all.find((b) => b.id === ref.boothId);
    if (!current) return { currentName: '', options: [] as Option[] };
    const byId = new Map(all.map((b) => [b.id, b]));
    return {
      currentName: `${current.number} · ${localize(current.name, locale)}`,
      options: boothAlternatives(current, all, exclude).map((a) => {
        const b = byId.get(a.id)!;
        const zone = zones.get(b.zoneId);
        return { ...a, name: `${b.number} · ${localize(b.name, locale)}`, category: te(`category.${b.category}`), area: zone ? te('zoneShort', { number: zone.number, name: localize(zone.name, locale) }) : '' };
      }),
    };
  }, [stop, plan, places.data, booths.data, layout.data, locale, tc, te]);

  const loading = places.isPending || booths.isPending;
  const selected = options.find((o) => o.id === choice) ?? null;

  const close = () => {
    setChoice(null);
    onClose();
  };

  const confirm = () => {
    if (!stop || !selected) return;
    const previous = sortedStops(plan).map((s) => ({ ...s }));
    replaceStop.mutate(
      { planId: plan.id, stops: replaceStopInputs(plan, stop.id, selected) },
      {
        onSuccess: () => {
          toast.success(t('doneToast', { from: currentName, to: selected.name }), {
            action: { label: t('undo'), onClick: () => restoreStops.mutate({ planId: plan.id, stops: previous }) },
          });
          close();
        },
      },
    );
  };

  return (
    <Dialog open={Boolean(stop)} onOpenChange={(o) => !o && close()}>
      {stop && (
        <DialogContent
          title={t('title', { name: currentName })}
          description={t('description')}
          footer={
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                {t('cancel')}
              </Button>
              <Button disabled={!selected} loading={replaceStop.isPending} onClick={confirm}>
                <ArrowLeftRight aria-hidden />
                {t('confirm')}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="type-caption text-fg-secondary bg-surface-muted flex flex-wrap items-center gap-2 rounded-md px-3 py-2" role="note">
              <DemoBadge />
              {t('demoNote')}
            </p>
            {loading ? (
              <div className="flex flex-col gap-2" aria-hidden>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : options.length === 0 ? (
              <p className="border-border text-fg-muted rounded-lg border border-dashed p-4 text-center text-sm">{t('none')}</p>
            ) : (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-bold">{t('chooseLabel')}</legend>
                {options.map((o) => {
                  const on = o.id === choice;
                  return (
                    <label
                      key={o.id}
                      className={cn('border-border hover:bg-surface-muted flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors', on && 'border-primary bg-primary/5')}
                    >
                      <input type="radio" name="replace-stop" className="accent-[var(--primary)] mt-1 size-4" checked={on} onChange={() => setChoice(o.id)} />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm font-bold" dir="auto">
                          {o.name}
                        </span>
                        <span className="type-caption text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>{o.category}</span>
                          {o.area && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden />
                              {o.area}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" aria-hidden />
                            {formatDuration(o.durationMin)}
                          </span>
                        </span>
                        <span className="flex flex-wrap gap-1">
                          {o.reasons.map((r) => (
                            <Badge key={r} tone="neutral">
                              {t(`reasons.${r}`)}
                            </Badge>
                          ))}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
