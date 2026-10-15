'use client';

import { CheckCheck, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { NotificationList, unreadCount, useNotifications } from '@/entities/notification';
import { useNotificationActions } from '@/features/manage-notifications';
import { Link } from '@/shared/i18n';
import { Button, ErrorState, SegmentedControl, Skeleton } from '@/shared/ui';

/** Notifications page (PRD §4.5) — the phone destination of the bell, also linked from the popover. */
export function NotificationsPageView() {
  const t = useTranslations('notifications');
  const list = useNotifications();
  const actions = useNotificationActions();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const items = list.data ?? [];
  const shown = filter === 'unread' ? items.filter((n) => !n.read) : items;
  const unread = unreadCount(items);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="type-h1">{t('title')}</h1>
          <p className="type-body text-fg-secondary">{t('subtitle')}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/settings#notifications">
            <Settings aria-hidden />
            {t('preferences')}
          </Link>
        </Button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          label={t('filterLabel')}
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'all', label: t('filterAll') },
            { value: 'unread', label: t('filterUnread', { count: unread }) },
          ]}
        />
        {unread > 0 && (
          <Button size="sm" variant="secondary" onClick={() => actions.markAllRead.mutate()} loading={actions.markAllRead.isPending}>
            <CheckCheck aria-hidden />
            {t('markAllRead')}
          </Button>
        )}
      </div>
      {list.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <div className="border-border bg-surface rounded-xl border p-1.5">
          <NotificationList items={shown} onOpen={(n) => actions.open(n)} />
        </div>
      )}
      <p className="type-caption text-fg-muted">{t('demoNote')}</p>
    </div>
  );
}
