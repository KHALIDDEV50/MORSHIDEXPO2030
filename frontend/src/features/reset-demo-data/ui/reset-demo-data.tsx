'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { resetAllDemoStores } from '@/shared/api';
import { Button, toast } from '@/shared/ui';

/**
 * Dev-only "Reset demo data" (docs/demo-data.md §4). Clears every `morshid:v1:*` demo store in
 * this browser and refetches all queries. Confirmation is inline (no browser dialogs).
 */
export function ResetDemoData() {
  const t = useTranslations('resetDemo');
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    resetAllDemoStores();
    void queryClient.invalidateQueries();
    setConfirming(false);
    toast.success(t('done'));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-bold">{t('title')}</span>
        <span className="type-caption text-fg-muted">{confirming ? t('question') : t('hint')}</span>
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            {t('cancel')}
          </Button>
          <Button variant="danger" size="sm" onClick={reset} autoFocus>
            {t('confirm')}
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
          <RotateCcw aria-hidden />
          {t('button')}
        </Button>
      )}
    </div>
  );
}
