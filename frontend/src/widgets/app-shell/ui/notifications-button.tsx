'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { NotificationList, unreadCount, useNotifications } from '@/entities/notification';
import { useNotificationActions } from '@/features/manage-notifications';
import { Link } from '@/shared/i18n';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/shared/ui';

const triggerClass =
  'focus-ring border-border bg-surface hover:bg-surface-muted text-fg relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border transition-colors';

/**
 * Notification bell (PRD §4.5): a popover on desktop, the full page on phones. Unread count badge;
 * opening a notification marks it read and follows its link. In-app demo notifications only.
 */
export function NotificationsButton() {
  const t = useTranslations('shell.notifications');
  const tn = useTranslations('notifications');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const list = useNotifications();
  const actions = useNotificationActions();
  const [open, setOpen] = useState(false);
  const items = list.data ?? [];
  const unread = unreadCount(items);
  const label = unread > 0 ? tn('labelUnread', { count: unread }) : t('label');

  const badge = unread > 0 && (
    <span className="bg-accent-pink ring-surface absolute -end-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full px-1 text-[0.625rem] leading-none font-bold text-white tabular-nums ring-2" aria-hidden>
      {unread > 9 ? '9+' : unread}
    </span>
  );

  if (!isDesktop) {
    return (
      <Link href="/notifications" aria-label={label} title={label} className={triggerClass}>
        <Bell className="size-[1.125rem]" aria-hidden />
        {badge}
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} title={label} className={triggerClass}>
          <Bell className="size-[1.125rem]" aria-hidden />
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="type-h4 text-base">{t('title')}</p>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={() => actions.markAllRead.mutate()}>
              <CheckCheck aria-hidden />
              {tn('markAllRead')}
            </Button>
          )}
        </div>
        <NotificationList items={items.slice(0, 5)} compact onOpen={(n) => actions.open(n, () => setOpen(false))} className="max-h-96 overflow-y-auto" />
        <div className="border-border border-t px-4 py-2.5">
          <Link href="/notifications" onClick={() => setOpen(false)} className="focus-ring text-primary rounded-sm text-sm font-bold hover:underline">
            {tn('viewAll')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
