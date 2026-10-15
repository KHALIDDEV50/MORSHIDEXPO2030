import { z } from 'zod';
import { ApiError, createDemoStore, demoCall } from '@/shared/api';
import { AppNotificationSchema, NotificationPrefsSchema } from '../model/notification';
import { seedNotifications } from './demo/notifications';
import type { NotificationRepository } from './notification.repository';

/** Persistent DEMO store (localStorage `morshid:v1:notifications`). */
export const notificationStore = createDemoStore(
  'notifications',
  z.object({ items: z.array(AppNotificationSchema), prefs: NotificationPrefsSchema }),
  seedNotifications,
);

export const mockNotificationRepository: NotificationRepository = {
  list: (signal) =>
    demoCall('notifications', () => {
      const { items, prefs } = notificationStore.get();
      // Muted kinds are hidden, newest first
      return items.filter((n) => prefs[n.kind]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, signal),
  markRead: (id) =>
    demoCall('notifications', () => {
      if (!notificationStore.get().items.some((n) => n.id === id)) throw new ApiError('NOT_FOUND', `Notification ${id} not found`);
      notificationStore.update((s) => ({ ...s, items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    }),
  markAllRead: () => demoCall('notifications', () => notificationStore.update((s) => ({ ...s, items: s.items.map((n) => ({ ...n, read: true })) }))),
  getPrefs: (signal) => demoCall('notifications', () => notificationStore.get().prefs, signal),
  setPrefs: (prefs) =>
    demoCall('notifications', () => {
      const valid = NotificationPrefsSchema.parse(prefs);
      notificationStore.update((s) => ({ ...s, prefs: valid }));
      return valid;
    }),
};
