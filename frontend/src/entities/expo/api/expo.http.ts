import { z } from 'zod';
import { request } from '@/shared/api';
import { ExpoBoothSchema, ExpoLayoutSchema } from '../model/expo';
import type { ExpoRepository } from './expo.repository';

/** HTTP implementation against the PROPOSED endpoints (api-contracts.md §4). Not connected yet. */
export const httpExpoRepository: ExpoRepository = {
  getLayout: (signal) => request('/expo/layout', { signal, schema: ExpoLayoutSchema }),
  searchBooths: (q, signal) =>
    request('/expo/booths', { signal, schema: z.array(ExpoBoothSchema), query: { q: q.q, category: q.category, zone: q.zoneId } }),
  getBooth: (id, signal) => request(`/expo/booths/${encodeURIComponent(id)}`, { signal, schema: ExpoBoothSchema }),
  getBooths: (ids, signal) => request('/expo/booths', { signal, schema: z.array(ExpoBoothSchema), query: { ids } }),
};
