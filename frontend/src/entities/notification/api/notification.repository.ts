import type { AppNotification, NotificationPrefs } from '../model/notification';

/** api-contracts.md §3 NotificationRepository. */
export interface NotificationRepository {
  list(signal?: AbortSignal): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  getPrefs(signal?: AbortSignal): Promise<NotificationPrefs>;
  setPrefs(prefs: NotificationPrefs): Promise<NotificationPrefs>;
}
