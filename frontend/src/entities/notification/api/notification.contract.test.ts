import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNotificationSchema, NOTIFICATION_KINDS, unreadCount } from '../model/notification';
import { seedNotifications } from './demo/notifications';
import { mockNotificationRepository, notificationStore } from './notification.mock';

async function run<T>(promise: Promise<T>): Promise<T> {
  const settled = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.runAllTimersAsync();
  const result = await settled;
  if ('error' in result) throw result.error;
  return result.value;
}

describe('demo notifications', () => {
  it('has 8 valid notifications of all 4 kinds, 3 unread', () => {
    const { items } = seedNotifications();
    for (const n of items) expect(AppNotificationSchema.safeParse(n).success, n.id).toBe(true);
    expect(items).toHaveLength(8);
    expect(new Set(items.map((n) => n.kind))).toEqual(new Set(NOTIFICATION_KINDS));
    expect(unreadCount(items)).toBe(3);
  });
});

describe('mockNotificationRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    notificationStore.reset();
  });
  afterEach(() => vi.useRealTimers());

  it('hides muted kinds and lists newest first', async () => {
    const list = await run(mockNotificationRepository.list());
    expect(list.some((n) => n.kind === 'announcement')).toBe(false); // muted in the seed prefs
    expect(list.map((n) => n.createdAt)).toEqual(list.map((n) => n.createdAt).sort().reverse());
  });

  it('marks one or all as read', async () => {
    await run(mockNotificationRepository.markRead('ntf_next_stop'));
    expect(unreadCount(notificationStore.get().items)).toBe(2);
    await run(mockNotificationRepository.markAllRead());
    expect(unreadCount(notificationStore.get().items)).toBe(0);
    await expect(run(mockNotificationRepository.markRead('ntf_missing'))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('saves preferences', async () => {
    const prefs = await run(mockNotificationRepository.setPrefs({ reminder: false, plan_update: true, recommendation: true, announcement: true }));
    expect(prefs.reminder).toBe(false);
    expect((await run(mockNotificationRepository.list())).some((n) => n.kind === 'reminder')).toBe(false);
  });
});
