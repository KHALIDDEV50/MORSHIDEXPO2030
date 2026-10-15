import { usesHttp } from '@/shared/config/env';
import { httpExpoRepository } from './expo.http';
import { mockExpoRepository } from './expo.mock';
import type { ExpoRepository } from './expo.repository';

/** Implementation chosen by NEXT_PUBLIC_DATA_SOURCE (+ NEXT_PUBLIC_LIVE_DOMAINS in hybrid mode) (architecture.md §3). */
export const expoRepository: ExpoRepository = usesHttp('expo') ? httpExpoRepository : mockExpoRepository;
