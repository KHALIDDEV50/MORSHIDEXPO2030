import type { BoothQuery, ExpoBooth, ExpoLayout } from '../model/expo';

/** api-contracts.md §3 — Expo venue repository. */
export interface ExpoRepository {
  getLayout(signal?: AbortSignal): Promise<ExpoLayout>;
  searchBooths(query: BoothQuery, signal?: AbortSignal): Promise<ExpoBooth[]>;
  getBooth(id: string, signal?: AbortSignal): Promise<ExpoBooth>;
  getBooths(ids: string[], signal?: AbortSignal): Promise<ExpoBooth[]>;
}
