'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationRepository as repo } from './repository';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
  prefs: () => ['notifications', 'prefs'] as const,
};

export function useNotifications() {
  return useQuery({ queryKey: notificationKeys.list(), queryFn: ({ signal }) => repo.list(signal) });
}

export function useNotificationPrefs() {
  return useQuery({ queryKey: notificationKeys.prefs(), queryFn: ({ signal }) => repo.getPrefs(signal) });
}
