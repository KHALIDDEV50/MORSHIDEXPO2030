import { usesHttp } from '@/shared/config/env';
import { httpNotificationRepository } from './notification.http';
import { mockNotificationRepository } from './notification.mock';
import type { NotificationRepository } from './notification.repository';

/** Implementation chosen by NEXT_PUBLIC_DATA_SOURCE (+ NEXT_PUBLIC_LIVE_DOMAINS in hybrid mode) (architecture.md §3). */
export const notificationRepository: NotificationRepository = usesHttp('notifications') ? httpNotificationRepository : mockNotificationRepository;
