import { ApiError, demoCall } from '@/shared/api';
import type { BoothQuery, ExpoBooth } from '../model/expo';
import { DEMO_BOOTHS, DEMO_FACILITIES, DEMO_OVERVIEW_IMAGES, DEMO_PATHS, DEMO_SITE, DEMO_ZONES } from './demo/expo';
import type { ExpoRepository } from './expo.repository';

/** Same normalization idea as place search: case/diacritics-insensitive, Arabic letter variants folded. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟ̀-ͯ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

/** Pure booth filter used by the demo repository (and its tests). */
export function queryBooths(booths: ExpoBooth[], query: BoothQuery): ExpoBooth[] {
  const q = normalize(query.q ?? '');
  return booths.filter(
    (b) =>
      (!query.category || b.category === query.category) &&
      (!query.zoneId || b.zoneId === query.zoneId) &&
      (!q || normalize(`${b.name.ar} ${b.name.en} ${b.number} ${b.summary.ar} ${b.summary.en}`).includes(q)),
  );
}

export const mockExpoRepository: ExpoRepository = {
  getLayout: (signal) => demoCall('expo', () => ({ zones: DEMO_ZONES, facilities: DEMO_FACILITIES, site: DEMO_SITE, paths: DEMO_PATHS, overviewImages: DEMO_OVERVIEW_IMAGES }), signal),
  searchBooths: (query, signal) => demoCall('expo', () => queryBooths(DEMO_BOOTHS, query), signal),
  getBooth: (id, signal) =>
    demoCall(
      'expo',
      () => {
        const booth = DEMO_BOOTHS.find((b) => b.id === id);
        if (!booth) throw new ApiError('NOT_FOUND', `Booth ${id} not found`);
        return booth;
      },
      signal,
    ),
  getBooths: (ids, signal) => demoCall('expo', () => ids.map((id) => DEMO_BOOTHS.find((b) => b.id === id)).filter((b): b is ExpoBooth => Boolean(b)), signal),
};
