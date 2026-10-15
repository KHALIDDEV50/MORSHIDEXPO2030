import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  return import('./env');
}

describe('usesHttp', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('mock: every domain stays on demo data', async () => {
    const { usesHttp, isDemoMode } = await loadEnv({ NEXT_PUBLIC_DATA_SOURCE: 'mock' });
    expect(usesHttp('places')).toBe(false);
    expect(isDemoMode).toBe(true);
  });

  it('hybrid: only the live domains use the API', async () => {
    const { usesHttp, isDemoMode } = await loadEnv({
      NEXT_PUBLIC_DATA_SOURCE: 'hybrid',
      NEXT_PUBLIC_LIVE_DOMAINS: '',
    });
    expect(usesHttp('places')).toBe(true);
    expect(usesHttp('expo')).toBe(true);
    expect(usesHttp('plans')).toBe(false);
    expect(usesHttp('conversations')).toBe(false);
    expect(isDemoMode).toBe(true);
  });

  it('hybrid: NEXT_PUBLIC_LIVE_DOMAINS narrows the live set', async () => {
    const { usesHttp } = await loadEnv({
      NEXT_PUBLIC_DATA_SOURCE: 'hybrid',
      NEXT_PUBLIC_LIVE_DOMAINS: 'expo',
    });
    expect(usesHttp('places')).toBe(false);
    expect(usesHttp('expo')).toBe(true);
  });

  it('http: every domain uses the API', async () => {
    const { usesHttp, isDemoMode } = await loadEnv({ NEXT_PUBLIC_DATA_SOURCE: 'http' });
    expect(usesHttp('notifications')).toBe(true);
    expect(isDemoMode).toBe(false);
  });
});
