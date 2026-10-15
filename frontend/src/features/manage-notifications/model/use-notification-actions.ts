'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationKeys, notificationRepository, type AppNotification, type NotificationPrefs } from '@/entities/notification';
import { useRouter } from '@/shared/i18n';

/** Read / unread and preference changes (PRD §4.5), refreshing every notification view. */
export function useNotificationActions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  const markRead = useMutation({ mutationFn: (id: string) => notificationRepository.markRead(id), onSuccess: () => void refresh() });
  const markAllRead = useMutation({ mutationFn: () => notificationRepository.markAllRead(), onSuccess: () => void refresh() });
  const setPrefs = useMutation({ mutationFn: (prefs: NotificationPrefs) => notificationRepository.setPrefs(prefs), onSuccess: () => void refresh() });

  /** Opening a notification marks it read and follows its link (if any). */
  const open = (n: AppNotification, after?: () => void) => {
    if (!n.read) markRead.mutate(n.id);
    after?.();
    if (n.link) router.push(n.link);
  };

  return { markRead, markAllRead, setPrefs, open };
}
