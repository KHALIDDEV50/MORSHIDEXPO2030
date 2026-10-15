'use client';

import { MicOff, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { VoiceInputErrorCode } from '@/shared/lib/speech';

/** Friendly explanation when voice input can't be used — the composer keeps working for typing. */
export function VoiceErrorNotice({ code, onDismiss }: { code: VoiceInputErrorCode; onDismiss: () => void }) {
  const t = useTranslations('voice.input');
  return (
    <div role="alert" className="border-warning/40 bg-warning-tint flex items-start gap-3 rounded-lg border px-3.5 py-2.5">
      <MicOff className="text-warning-fg mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-fg text-sm font-bold">{t(`errors.${code}.title`)}</p>
        <p className="type-body-sm text-fg-secondary font-normal">{t(`errors.${code}.body`)}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('dismiss')}
        className="focus-ring text-fg-muted hover:text-fg -me-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
