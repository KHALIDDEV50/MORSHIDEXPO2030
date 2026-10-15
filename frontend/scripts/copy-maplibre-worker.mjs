/**
 * MapLibre GL v6 loads its web worker from a separate ES module (`maplibre-gl-worker.mjs`, which
 * imports `maplibre-gl-shared.mjs`) located next to its own script. Inside a Next.js bundle those
 * files are not emitted, so we copy them to `public/vendor/maplibre-gl/<version>/` and point
 * MapLibre at them with `setWorkerUrl` (shared/map/maplibre). Runs on postinstall/predev/prebuild.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = join(root, 'node_modules', 'maplibre-gl');
if (!existsSync(pkgDir)) process.exit(0);

const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const target = join(root, 'public', 'vendor', 'maplibre-gl', version);
mkdirSync(target, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(join(pkgDir, 'dist', file), join(target, file));
}
console.log(`maplibre-gl ${version} worker copied to public/vendor/maplibre-gl/${version}/`);
