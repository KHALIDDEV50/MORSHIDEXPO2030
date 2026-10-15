import { expect, test, type Page } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/**
 * Public website (docs/public-site.md): navigation, the login gateway (demo vs guest vs demo
 * sign-in), the journal (filters + article pages), honest labels, and reduced motion.
 */
const site = en.site;

async function openNav(page: Page, testInfo: { project: { use: { viewport?: { width: number } | null } } }) {
  const wide = (testInfo.project.use.viewport?.width ?? 1280) >= 1280;
  if (!wide) await page.getByRole('button', { name: site.nav.menu }).click();
  return wide ? page.getByRole('banner').getByRole('navigation', { name: site.nav.label }) : page.getByRole('dialog').getByRole('navigation', { name: site.nav.label });
}

test('public pages are reachable from the header without signing in', async ({ page }, testInfo) => {
  const pages = [
    [site.nav.destinations, /\/en\/destinations$/],
    [site.nav.features, /\/en\/features$/],
    [site.nav.howItWorks, /\/en\/how-it-works$/],
    [site.nav.guides, /\/en\/guides$/],
    [site.nav.journal, /\/en\/blog$/],
    [site.nav.mobileApp, /\/en\/mobile-app$/],
  ] as const;
  for (const [label, url] of pages) {
    await page.goto('/en');
    const nav = await openNav(page, testInfo);
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('footer links to the legal drafts, which say they are drafts', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('contentinfo').getByRole('link', { name: site.footer.links.privacy }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.getByText(site.legal.draftTitle)).toBeVisible();
  await expect(page.getByText(site.legal.needsLegal).first()).toBeVisible();
  await page.goto('/en/terms');
  await expect(page.getByText(site.legal.draftTitle)).toBeVisible();
});

test('home hero (Expo-first, P-024): the main calls to action open real routes', async ({ page }) => {
  await page.goto('/en');
  const hero = page.getByRole('region', { name: /Your guide to/ });
  await expect(hero.getByRole('link', { name: site.home.hero.ctaMap })).toHaveAttribute('href', '/en/expo');
  await expect(hero.getByRole('link', { name: site.home.hero.ctaDiscover })).toHaveAttribute('href', '/en/destinations');
  await hero.getByRole('link', { name: site.home.hero.ctaPlan }).click();
  await expect(page).toHaveURL(/\/en\/chat$/);
});

test('the home page says the Expo preview is illustrative and links each district to the map', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByText(site.home.hero.note)).toBeVisible();
  await expect(page.getByText('Concept rendering — not a photograph').first()).toBeVisible();
  const zones = page.getByRole('region', { name: site.home.zones.title });
  await zones.scrollIntoViewIfNeeded();
  await expect(zones.getByText(site.home.zones.note)).toBeVisible();
  await expect(zones.getByRole('link', { name: new RegExp(site.expoDistricts.items.earth.name) })).toHaveAttribute('href', '/en/expo?zone=zone_earth');
});

test('theme: light by default, a sun/moon toggle switches the whole site, and the choice persists (P-022)', async ({ page }) => {
  const bg = () => page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.goto('/en');
  await expect(page.locator('html')).toHaveClass(/site-public/);
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  expect(await bg()).toBe('rgb(250, 248, 243)'); // warm ivory

  await page.getByRole('button', { name: en.theme.toDark }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect.poll(bg).toBe('rgb(22, 21, 18)'); // warm charcoal
  await expect(page.getByRole('button', { name: en.theme.toLight })).toBeVisible();

  // Kept across public pages, in Arabic too, and shared with the platform
  for (const path of ['/en/features', '/ar/guides', '/en/blog', '/en/login']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await bg(), path).toBe('rgb(22, 21, 18)');
  }
  await page.goto('/en/discover');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).not.toHaveClass(/site-public/);
});

test('theme: a saved light preference is respected on the platform and the public site', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('theme', 'light'));
  await page.goto('/en/discover');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.goto('/ar');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: ar.theme.toDark })).toBeVisible();
});

test('login gateway: "Continue as a guest" needs no credentials and opens the app as a guest', async ({ page }) => {
  await page.goto('/en/login');
  await expect(page.getByRole('heading', { level: 1, name: en.auth.gateway.title })).toBeVisible();
  // The demo starts on the sample profile, so the gateway offers to continue or switch to guest
  await page.getByRole('button', { name: en.auth.gateway.switchToGuest }).click();
  await expect(page).toHaveURL(/\/en\/chat$/);
  await page.goto('/en/login');
  await expect(page.getByRole('button', { name: en.auth.gateway.tryCta })).toBeVisible();
  await expect(page.getByText(en.auth.gateway.tryNote)).toBeVisible();
});

test('login gateway: "Try the demo" opens the sample profile without typing anything', async ({ page }) => {
  await page.goto('/en/settings?demoProfile=guest');
  await page.goto('/en/login?next=%2Fplans');
  await page.getByRole('button', { name: en.auth.gateway.tryCta }).click();
  await expect(page).toHaveURL(/\/en\/plans$/);
});

test('journal: category filter is in the URL and articles open with sources and sample status', async ({ page }) => {
  await page.goto('/en/blog');
  await expect(page.getByText(site.journal.sampleNotice)).toBeVisible();
  await page.getByRole('group', { name: site.journal.filterLabel }).getByRole('button', { name: site.journal.categories.expo }).click();
  await expect(page).toHaveURL(/category=expo/);
  await page.getByRole('link', { name: /Preparing for Expo 2030 Riyadh/ }).first().click();
  await expect(page).toHaveURL(/\/en\/blog\/preparing-for-expo-2030-riyadh$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Preparing for Expo 2030 Riyadh/);
  await expect(page.getByText(site.journal.articleSampleNote)).toBeVisible();
  await expect(page.getByRole('heading', { name: site.journal.sources })).toBeVisible();
});

test('unknown article → 404', async ({ page }) => {
  const res = await page.goto('/en/blog/does-not-exist');
  expect(res?.status()).toBe(404);
});

test('mobile app page: coming soon, and no store links', async ({ page }) => {
  await page.goto('/en/mobile-app');
  await expect(page.getByText(site.mobile.hero.badge).first()).toBeVisible();
  await expect(page.getByText(site.mobile.hero.notAvailable).first()).toBeVisible();
  await expect(page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('content is fully visible without animation', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('heading', { name: site.home.help.title }).scrollIntoViewIfNeeded();
    await expect(page.getByText(site.itineraryDemo.review)).toBeVisible();
  });
});

test('Arabic public pages render right-to-left with Arabic navigation', async ({ page }, testInfo) => {
  await page.goto('/ar/destinations');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const wide = (testInfo.project.use.viewport?.width ?? 1280) >= 1280;
  if (!wide) await page.getByRole('button', { name: ar.site.nav.menu }).click();
  await expect(page.getByRole('link', { name: ar.site.nav.features, exact: true }).first()).toBeVisible();
});
