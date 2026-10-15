import { z } from 'zod';

/**
 * Domains with a real backend today (MORSHID-Expo2030 Spring Boot API). In "hybrid" mode only these
 * use HTTP; everything else (plans, chat, notifications, auth …) stays on demo data.
 */
export const LIVE_DOMAINS = ['places', 'expo'] as const;
export type LiveDomain = (typeof LIVE_DOMAINS)[number];

/**
 * Public runtime configuration (.env.example). Validated once; invalid values fall back to safe
 * defaults (demo mode) instead of crashing the app.
 */
const EnvSchema = z.object({
  dataSource: z.enum(['mock', 'http', 'hybrid']).catch('mock'),
  apiBaseUrl: z.string().url().optional().catch(undefined),
  liveDomains: z.array(z.enum(LIVE_DOMAINS)).catch([...LIVE_DOMAINS]),
  mapProvider: z.enum(['maplibre', 'google']).catch('maplibre'),
  mapStyleLight: z.string().url().catch('https://tiles.openfreemap.org/styles/positron'),
  mapStyleDark: z.string().url().catch('https://tiles.openfreemap.org/styles/dark'),
});

const rawLiveDomains = process.env.NEXT_PUBLIC_LIVE_DOMAINS;

export const env = EnvSchema.parse({
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  liveDomains: rawLiveDomains ? rawLiveDomains.split(',').map((d) => d.trim()).filter(Boolean) : [...LIVE_DOMAINS],
  mapProvider: process.env.NEXT_PUBLIC_MAP_PROVIDER,
  mapStyleLight: process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT,
  mapStyleDark: process.env.NEXT_PUBLIC_MAP_STYLE_DARK,
});

export type DataSource = typeof env.dataSource;
/** Demo tooling stays on while any domain still runs on demo data (mock or hybrid). */
export const isDemoMode = env.dataSource !== 'http';

/** Whether a domain's repository talks to the real API ("http": all, "hybrid": LIVE_DOMAINS only). */
export function usesHttp(domain: LiveDomain | 'plans' | 'conversations' | 'notifications'): boolean {
  if (env.dataSource === 'http') return true;
  if (env.dataSource === 'hybrid') return (env.liveDomains as string[]).includes(domain);
  return false;
}
