import { z } from 'zod';
import { request } from '@/shared/api';
import { AppNotificationSchema, NotificationPrefsSchema } from '../model/notification';
import type { NotificationRepository } from './notification.repository';

/** HTTP implementation against the PROPOSED endpoints (api-contracts.md §4). Not connected yet. */
export const httpNotificationRepository: NotificationRepository = {
  list: (signal) => request('/notifications', { signal, schema: z.array(AppNotificationSchema) }),
  markRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', schema: z.null() }).then(() => undefined),
  markAllRead: () => request('/notifications/read-all', { method: 'POST', schema: z.null() }).then(() => undefined),
  getPrefs: (signal) => request('/notifications/prefs', { signal, schema: NotificationPrefsSchema }),
  setPrefs: (prefs) => request('/notifications/prefs', { method: 'PUT', body: prefs, schema: NotificationPrefsSchema }),
};
