'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Check, Lock, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { planKeys, planRepository, planStatus, usePlanCount, usePlans, type Plan } from '@/entities/plan';
import type { ExpoBooth } from '@/entities/expo';
import type { Place } from '@/entities/place';
import { canSavePlan, useSubscriptionSnapshot } from '@/entities/subscription';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import { requestSignIn } from '@/shared/lib/auth-gate';
import { Button, Dialog, DialogContent, Input, Label, Skeleton, toast } from '@/shared/ui';
import { addablePlans, defaultTarget, planHasPlace, type AddTarget } from '../model/add-to-plan';

/** What can be added: a tourism place, or an Expo pavilion (booth) — each only to plans of its type. */
type Item = { place: Place; booth?: never } | { booth: ExpoBooth; place?: never };
type Props = Item & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function itemOf({ place, booth }: Item) {
  if (place) return { id: place.id, name: place.name, durationMin: place.suggestedDurationMin, type: 'tourism' as const, ref: { kind: 'place' as const, placeId: place.id } };
  return { id: booth!.id, name: booth!.name, durationMin: booth!.suggestedDurationMin, type: 'expo' as const, ref: { kind: 'booth' as const, boothId: booth!.id } };
}

/**
 * Plan picker (PRD §4.2 "Add to plan"): add the place to an existing plan or start a new draft
 * plan. Uses the same plan model and repository as Chat proposals (D-016..D-021). Guests and
 * accounts at their saved-plan limit can't create plans (P-012 entitlements; the server must
 * enforce the same rule).
 */
export function AddToPlanDialog({ open, onOpenChange, ...itemProps }: Props) {
  const t = useTranslations('addToPlan');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const item = itemOf(itemProps as Item);
  const placeName = localize(item.name, locale);
  const newNameId = useId();

  const { subscription } = useSubscriptionSnapshot();
  // Saved-plan limit (P-012) against the real number of plans
  const createCheck = canSavePlan(subscription, usePlanCount());
  // Guests may pick any option — they're asked to sign in when confirming (then it completes)
  const guest = subscription === null;
  const canCreate = createCheck.allowed || guest;
  const plansQuery = usePlans({ tab: 'all', pageSize: 100 });
  const plans = addablePlans(plansQuery.data?.items ?? [], item.type);

  // null = "not chosen yet" → fall back to the computed default (no state syncing in effects)
  const [chosen, setChosen] = useState<AddTarget | null>(null);
  const [typedName, setTypedName] = useState<string | null>(null);
  const defaultName = t('newPlanName', { name: placeName });
  const newName = typedName ?? defaultName;
  const target = chosen ?? (plansQuery.data ? defaultTarget(plansQuery.data.items, item.id, defaultName, canCreate, item.type) : null);
  const setTarget = setChosen;
  const setNewName = setTypedName;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Start fresh next time
      setChosen(null);
      setTypedName(null);
    }
    onOpenChange(next);
  };

  const add = useMutation({
    mutationFn: async (to: AddTarget): Promise<Plan> => {
      const stop = { ref: item.ref, durationMin: item.durationMin, completedAt: null };
      if (to.kind === 'existing') return planRepository.addStop(to.planId, stop);
      return planRepository.create({ name: to.name.trim(), type: item.type, isDraft: true, stops: [stop] });
    },
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      toast.success(t('addedToast', { name: placeName, plan: plan.name }));
      handleOpenChange(false);
    },
    onError: () => toast.error(t('errorToast')),
  });

  const canSubmit = target !== null && (target.kind === 'existing' || (canCreate && newName.trim().length > 0)) && !add.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        title={t('title', { name: placeName })}
        description={t('description')}
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={async () => {
                if (!target) return;
                if (guest && !(await requestSignIn())) return; // PRD §4.7: sign in, then the save completes
                add.mutate(target.kind === 'new' ? { kind: 'new', name: newName } : target);
              }}
            >
              <CalendarPlus aria-hidden />
              {add.isPending ? t('adding') : t('confirm')}
            </Button>
          </div>
        }
      >
        {guest && (
          <p className="type-caption text-fg-secondary bg-surface-muted mb-3 rounded-md px-3 py-2" role="note">
            {t('guestNote')}
          </p>
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">{t('chooseLabel')}</legend>
          {plansQuery.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {plans.map((plan) => {
                const already = planHasPlace(plan, item.id);
                const selected = target?.kind === 'existing' && target.planId === plan.id;
                return (
                  <li key={plan.id}>
                    <label
                      className={cn(
                        'border-border flex items-center gap-3 rounded-lg border p-3',
                        already ? 'opacity-60' : 'hover:bg-surface-muted cursor-pointer',
                        selected && 'border-primary bg-primary/5',
                      )}
                    >
                      <input
                        type="radio"
                        name="add-to-plan-target"
                        className="accent-[var(--primary)] size-4"
                        checked={selected}
                        disabled={already}
                        onChange={() => setTarget({ kind: 'existing', planId: plan.id })}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-bold" dir="auto">
                          {plan.name}
                        </span>
                        <span className="type-caption text-fg-muted">
                          {t('planMeta', { stops: plan.stops.length, status: planStatus(plan) })}
                        </span>
                      </span>
                      {already && (
                        <span className="type-caption text-success-fg inline-flex items-center gap-1">
                          <Check className="size-3.5" aria-hidden />
                          {t('alreadyIn')}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}

              {/* New plan */}
              <li>
                <label
                  className={cn(
                    'border-border flex flex-col gap-2 rounded-lg border p-3',
                    canCreate ? 'hover:bg-surface-muted cursor-pointer' : 'opacity-70',
                    target?.kind === 'new' && 'border-primary bg-primary/5',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="add-to-plan-target"
                      className="accent-[var(--primary)] size-4"
                      checked={target?.kind === 'new'}
                      disabled={!canCreate}
                      onChange={() => setTarget({ kind: 'new', name: newName })}
                    />
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                      {canCreate ? <Plus className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                      {t('newPlan')}
                    </span>
                  </span>
                  {canCreate ? (
                    target?.kind === 'new' && (
                      <span className="flex flex-col gap-1.5 ps-7">
                        <Label htmlFor={newNameId}>{t('newPlanNameLabel')}</Label>
                        <Input id={newNameId} value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} />
                        <span className="type-caption text-fg-muted">{t('newPlanHint')}</span>
                      </span>
                    )
                  ) : (
                    <span className="type-caption text-fg-muted ps-7">
                      {createCheck.reason === 'sign_in_required' ? t('signInRequired') : t('limitReached')}
                    </span>
                  )}
                </label>
              </li>
            </ul>
          )}
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}

/** "Add to plan" button + its dialog. */
export function AddToPlanButton({ variant = 'primary', className, ...target }: Item & { variant?: 'primary' | 'secondary'; className?: string }) {
  const t = useTranslations('addToPlan');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        <CalendarPlus aria-hidden />
        {t('button')}
      </Button>
      <AddToPlanDialog {...(target as Item)} open={open} onOpenChange={setOpen} />
    </>
  );
}
