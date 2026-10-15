'use client';

import { Bell, BellOff, CalendarClock, Lightbulb, Megaphone, RefreshCw } from 'lucide-react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { localize } from '@/shared/api';
import { cn } from '@/shared/lib';
import type { AppNotification, NotificationKind } from '../model/notification';

export const NOTIFICATION_ICON: Record<NotificationKind, ReactNode> = {
  reminder: <CalendarClock />,
  plan_update: <RefreshCw />,
  recommendation: <Lightbulb />,
  announcement: <Megaphone />,
};

/** Notification rows: unread dot + bold title, kind icon, relative time; selecting opens / marks read. */
export function NotificationList({
  items,
  onOpen,
  compact = false,
  className,
}: {
  items: AppNotification[];
  onOpen: (n: AppNotification) => void;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const format = useFormatter();
  // One reference time for every row ("5 minutes ago"), refreshed each minute so labels stay current
  const now = useNow({ updateInterval: 60_000 });

  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center gap-2 px-6 py-8 text-center', className)}>
        <span className="bg-surface-brand text-primary grid size-12 place-items-center rounded-full" aria-hidden>
          <BellOff className="size-5" />
        </span>
        <p className="text-sm font-bold">{t('emptyTitle')}</p>
        <p className="type-body-sm text-fg-secondary font-normal">{t('emptyBody')}</p>
      </div>
    );
  }

  return (
    <ul className={cn('flex flex-col', className)}>
      {items.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onOpen(n)}
            className={cn('focus-ring hover:bg-surface-muted flex w-full items-start gap-3 text-start', compact ? 'px-4 py-3' : 'rounded-lg px-3 py-3', !n.read && 'bg-surface-brand/60')}
          >
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-4', n.read ? 'bg-surface-muted text-fg-muted' : 'bg-primary-tint text-primary')} aria-hidden>
              {NOTIFICATION_ICON[n.kind] ?? <Bell />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn('text-sm', n.read ? 'font-medium' : 'font-bold')}>
                {!n.read && <span className="sr-only">{t('unread')}: </span>}
                {localize(n.title, locale)}
              </span>
              <span className="type-body-sm text-fg-secondary line-clamp-2 font-normal">{localize(n.body, locale)}</span>
              <span className="type-caption text-fg-muted">
                {t(`kinds.${n.kind}`)} · {format.relativeTime(new Date(n.createdAt), now)}
              </span>
            </span>
            {!n.read && <span className="bg-accent-pink mt-1.5 size-2 shrink-0 rounded-full" aria-hidden />}
          </button>
        </li>
      ))}
    </ul>
  );
}
