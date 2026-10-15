import { z } from 'zod';
import { IsoDateTimeSchema, LocalizedTextSchema } from '@/shared/api';

/** api-contracts.md §2 — in-app notifications (no push or email in the demo). */
export const NOTIFICATION_KINDS = ['reminder', 'plan_update', 'recommendation', 'announcement'] as const;

export const AppNotificationSchema = z.object({
  id: z.string().startsWith('ntf_'),
  kind: z.enum(NOTIFICATION_KINDS),
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  /** Locale-less app path, e.g. "/plans/plan_heritage_day" */
  link: z.string().startsWith('/').optional(),
  read: z.boolean(),
  createdAt: IsoDateTimeSchema,
});

export const NotificationPrefsSchema = z.object({
  reminder: z.boolean(),
  plan_update: z.boolean(),
  recommendation: z.boolean(),
  announcement: z.boolean(),
});

export type AppNotification = z.infer<typeof AppNotificationSchema>;
export type NotificationKind = AppNotification['kind'];
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;

export function unreadCount(items: AppNotification[]): number {
  return items.filter((n) => !n.read).length;
}
