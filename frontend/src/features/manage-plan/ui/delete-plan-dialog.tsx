'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Plan } from '@/entities/plan';
import { Button, Dialog, DialogContent } from '@/shared/ui';
import { usePlanActions } from '../model/use-plan-actions';

/** Delete confirmation (PRD §4.4): only the buttons or Esc close it. */
export function DeletePlanDialog({ plan, onClose, onDeleted }: { plan: Plan | null; onClose: () => void; onDeleted?: () => void }) {
  const t = useTranslations('managePlan');
  const { remove } = usePlanActions();
  return (
    <Dialog open={plan !== null} onOpenChange={(o) => !o && onClose()}>
      {plan && (
        <DialogContent
          title={t('deleteTitle')}
          description={t('deleteDescription', { name: plan.name })}
          closeOnOutsideClick={false}
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(plan.id, {
                    onSuccess: () => {
                      onClose();
                      onDeleted?.();
                    },
                  })
                }
              >
                <Trash2 aria-hidden />
                {t('delete')}
              </Button>
            </div>
          }
        >
          {null}
        </DialogContent>
      )}
    </Dialog>
  );
}
