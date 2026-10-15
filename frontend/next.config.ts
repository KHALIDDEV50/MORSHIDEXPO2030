import type { NextConfig } from 'next';
import path from 'node:path';

/**
 * next-intl request config location.
 *
 * We intentionally do NOT use `createNextIntlPlugin` from 'next-intl/plugin': it eagerly loads
 * `@swc/core`, whose native addon refuses to load on this machine (drive-root ACL check,
 * ERR_SWC_NATIVE_CACHE). Without next-intl's experimental features, the plugin only registers
 * the `next-intl/config` alias below — so we register it ourselves (see docs/decisions.md D-028).
 */
const I18N_REQUEST_CONFIG = './src/shared/i18n/request.ts';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    resolveAlias: {
      'next-intl/config': I18N_REQUEST_CONFIG,
    },
  },
  webpack(config: { resolve?: { alias?: Record<string, string> } }) {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias['next-intl/config'] = path.resolve(process.cwd(), I18N_REQUEST_CONFIG);
    return config;
  },
};

export default nextConfig;
