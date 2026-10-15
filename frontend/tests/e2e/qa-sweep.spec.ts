import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Phase 12 — integration & final QA sweep (implementation-plan.md §12):
 * every main route × locale × theme, checking console errors, failed same-origin requests
 * (broken images / chunks), horizontal overflow and axe accessibility (serious + critical).
 * The full matrix runs on three representative viewports to keep the suite fast; the other
 * projects run the regular feature specs.
 */
const SWEEP_PROJECTS = new Set(['mobile-360', 'tablet-768', 'desktop-1280']);

const ROUTES = [
  '',
  '/features',
  '/destinations',
  '/how-it-works',
  '/guides',
  '/blog',
  '/blog?category=expo',
  '/blog/unesco-sites-in-morshid',
  '/mobile-app',
  '/privacy',
  '/terms',
  '/chat',
  '/chat?view=map',
  '/chat?view=expo',
  '/discover',
  '/discover?region=saudi',
  '/discover/plc_hegra',
  '/expo',
  '/expo/booth_main_stage',
  '/plans',
  '/plans/new',
  '/plans/plan_heritage_day',
  '/plans/plan_modern_evening/guide',
  '/login',
  '/signup',
  '/notifications',
  '/settings',
];

/** External map tiles / fonts are not part of the app's own assets */
const isOwnRequest = (url: string, origin: string) => url.startsWith(origin);

async function visit(page: Page, url: string) {
  const errors: string[] = [];
  const failed: string[] = [];
  const origin = new URL(url).origin;
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400 && isOwnRequest(res.url(), origin)) failed.push(`${res.status()} ${res.url()}`);
  });
  await page.goto(url);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  return { errors, failed };
}

for (const theme of ['light', 'dark'] as const) {
  for (const locale of ['ar', 'en'] as const) {
    test.describe(`QA sweep · ${locale} · ${theme}`, () => {
      test.beforeEach(async ({ page }, testInfo) => {
        test.skip(!SWEEP_PROJECTS.has(testInfo.project.name), 'Matrix runs on three representative viewports');
        await page.addInitScript((value) => window.localStorage.setItem('theme', value), theme);
      });

      for (const route of ROUTES) {
        test(`/${locale}${route}`, async ({ page, baseURL }) => {
          const url = `${baseURL}/${locale}${route}`;
          const { errors, failed } = await visit(page, url);

          expect(failed, 'failed same-origin requests').toEqual([]);
          expect(errors, 'console errors').toEqual([]);

          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(0);

          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).exclude('.maplibregl-canvas').analyze();
          const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
          expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
        });
      }
    });
  }
}

const PUBLIC_PAGES = ['', '/features', '/destinations', '/how-it-works', '/guides', '/blog', '/blog/historic-riyadh-first-morning', '/mobile-app', '/privacy', '/terms', '/login'];

test('public website: every internal link resolves (no dead ends)', async ({ page, request, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Link check runs once');
  const checked = new Set<string>();
  for (const locale of ['ar', 'en']) {
    for (const path of PUBLIC_PAGES) {
      await page.goto(`/${locale}${path}`);
      await page.waitForLoadState('networkidle').catch(() => undefined);
      const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) => [...new Set(links.map((a) => (a.getAttribute('href') ?? '').split('#')[0]!))]);
      expect(hrefs.length, `${locale}${path}`).toBeGreaterThan(10);
      for (const href of hrefs) {
        if (!href || checked.has(href)) continue;
        checked.add(href);
        const res = await request.get(`${baseURL}${href}`);
        expect(res.status(), `${href} (linked from /${locale}${path})`).toBeLessThan(400);
      }
    }
  }
});
