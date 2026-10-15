'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { planKeys, planRepository, type Plan, type PlanStopInput } from '@/entities/plan';
import { toast } from '@/shared/ui';

/**
 * Plan mutations shared by the overview, plan details and guided mode. Every change goes through
 * the plan repository and refreshes all plan queries, so List, Map and Guided stay in sync (D-019).
 */
export function usePlanActions() {
  const t = useTranslations('managePlan');
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: planKeys.all });
  const onError = () => toast.error(t('errorToast'));

  const setCompleted = useMutation({
    mutationFn: ({ planId, stopId, completed }: { planId: string; stopId: string; completed: boolean }) => planRepository.setStopCompleted(planId, stopId, completed),
    onSuccess: () => void refresh(),
    onError,
  });

  const start = useMutation({
    mutationFn: (planId: string) => planRepository.start(planId),
    onSuccess: () => void refresh(),
    onError,
  });

  const remove = useMutation({
    mutationFn: (planId: string) => planRepository.remove(planId),
    onSuccess: () => {
      void refresh();
      toast.success(t('deletedToast'));
    },
    onError,
  });

  const removeStop = useMutation({
    mutationFn: ({ planId, stopId }: { planId: string; stopId: string }) => planRepository.removeStop(planId, stopId),
    onSuccess: () => void refresh(),
    onError,
  });

  /** Undo for "remove stop": puts back the exact previous list (ids, order, completion). */
  const restoreStops = useMutation({
    mutationFn: ({ planId, stops }: { planId: string; stops: PlanStopInput[] }) => planRepository.update(planId, { stops }),
    onSuccess: () => void refresh(),
    onError,
  });

  /** Swap one stop for an alternative (the whole ordered list is saved, other stops untouched). */
  const replaceStop = useMutation({
    mutationFn: ({ planId, stops }: { planId: string; stops: PlanStopInput[] }) => planRepository.update(planId, { stops }),
    onSuccess: () => void refresh(),
    onError,
  });

  const copyFeatured = useMutation({
    mutationFn: ({ featuredId, locale }: { featuredId: string; locale: string }) => planRepository.copyFeatured(featuredId, locale),
    onSuccess: (plan) => {
      void refresh();
      toast.success(t('copiedToast', { name: plan.name }));
    },
    onError,
  });

  /**
   * Manual completion with Undo (PRD §4.4 "Completion is undoable").
   * Returns a promise so guided mode can advance after the change is saved.
   */
  const toggleCompleted = async (plan: Plan, stopId: string, completed: boolean, stopName: string) => {
    await setCompleted.mutateAsync({ planId: plan.id, stopId, completed });
    if (completed) {
      toast.success(t('completedToast', { name: stopName }), {
        action: { label: t('undo'), onClick: () => setCompleted.mutate({ planId: plan.id, stopId, completed: false }) },
      });
    }
  };

  return { toggleCompleted, start, remove, removeStop, restoreStops, replaceStop, copyFeatured, setCompleted, refresh };
}
