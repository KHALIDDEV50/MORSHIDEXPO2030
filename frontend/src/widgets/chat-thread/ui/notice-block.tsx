'use client';

import { CircleAlert, Coins, FlaskConical } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { MessageBlock } from '@/entities/conversation';
import { localize } from '@/shared/api';
import { Link } from '@/shared/i18n';

type Notice = Extract<MessageBlock, { type: 'notice' }>;

/** System notices (PRD §4.1 type 4): demo label, out of credits (with an upgrade link), error. */
export function NoticeBlock({ notice }: { notice: Notice }) {
  const t = useTranslations('chatThread');
  const locale = useLocale();
  const text = localize(notice.text, locale);

  if (notice.kind === 'demo') {
    return (
      <p className="type-caption text-fg-muted flex items-center gap-1.5 px-1">
        <FlaskConical className="size-3.5" aria-hidden />
        {text}
      </p>
    );
  }
  if (notice.kind === 'out_of_credits') {
    return (
      <div role="status" className="border-warning/40 bg-warning-tint flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
        <Coins className="text-warning-fg size-4 shrink-0" aria-hidden />
        <span className="flex-1">{text}</span>
        <Link href="/settings/plans" className="focus-ring text-primary rounded-sm font-bold underline-offset-4 hover:underline">
          {t('seePlans')}
        </Link>
      </div>
    );
  }
  return (
    <div role="alert" className="border-error/40 bg-error-tint text-error-fg flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {text}
    </div>
  );
}
