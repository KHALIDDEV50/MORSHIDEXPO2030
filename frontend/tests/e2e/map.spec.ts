import { expect, test } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/**
 * Phase 5 map foundation on the dev review page (/dev/map).
 * The tourism map loads OpenFreeMap tiles over the network; the Expo map needs no network.
 */
const DICT = { ar, en } as const;

for (const locale of ['ar', 'en'] as const) {
  const t = DICT[locale].mapPlayground;
  const map = DICT[locale].map;

  test(`Expo site plan: four districts, numbered locations and the details panel (P-023) — ${locale}`, async ({ page }) => {
    const x = DICT[locale].expoMap;
    await page.goto(`/${locale}/dev/map`);
    const expo = page.getByRole('region', { name: x.mapLabel, exact: true });
    await expect(expo).toBeVisible();
    await expect(page.getByText(map.illustrative)).toBeVisible();

    // Numbered marker 3.2 shows its number on the map and selects with the keyboard
    const boothName = locale === 'ar' ? /قاعة تجربة الذكاء الاصطناعي/ : /AI Experience Hall/;
    const marker = expo.getByRole('button', { name: boothName });
    await expect(marker).toContainText('3.2');
    await marker.focus();
    await page.keyboard.press('Enter');
    await expect(marker).toHaveAttribute('aria-pressed', 'true');

    // The details panel follows the map selection
    const details = page.getByRole('region', { name: x.detailsLabel });
    await expect(details).toContainText(boothName);

    // A district chip over the map selects the district; "Whole site" returns to the overview
    const zoneName = locale === 'ar' ? 'الأرض' : 'Earth';
    const chips = page.getByRole('group', { name: x.zonesLabel });
    await chips.getByRole('button', { name: new RegExp(zoneName) }).click();
    await expect(details).toContainText(zoneName);
    await chips.getByRole('button', { name: x.wholeSite }).click();
    await expect(details).toContainText(x.overviewTitle);
  });

  test(`tourism map renders real tiles in light and dark — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/dev/map`);
    const tourism = page.getByRole('region', { name: t.mapLabel.tourism, exact: true });
    await expect(tourism.locator('canvas.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(tourism.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap');

    const masmak = tourism.getByRole('button', { name: locale === 'ar' ? 'قصر المصمك' : 'Masmak Fortress' });
    await masmak.click();
    await expect(masmak).toHaveAttribute('aria-pressed', 'true');

    // Switch theme: the map keeps its markers after the style swap
    await page.evaluate(() => localStorage.setItem('theme', 'dark')); // next-themes storage key
    await page.reload();
    await expect(page.getByRole('region', { name: t.mapLabel.tourism, exact: true }).locator('canvas.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('region', { name: t.mapLabel.tourism, exact: true }).getByRole('button', { name: locale === 'ar' ? 'قصر المصمك' : 'Masmak Fortress' })).toBeVisible();
  });

  test(`plan route shows numbered stops in order — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/dev/map`);
    const route = page.getByRole('region', { name: t.mapLabel.route, exact: true });
    const first = route.getByRole('button', { name: new RegExp(t.stopLabel.replace('{number}', '1').split('{name}')[0]!) });
    await expect(first).toBeVisible({ timeout: 20_000 });
    // Start and end points around the numbered stops
    await expect(route.getByRole('button', { name: new RegExp(t.startLabel.split('{name}')[0]!) })).toBeVisible();
    await expect(route.getByRole('button', { name: new RegExp(t.endLabel.split('{name}')[0]!) })).toBeVisible();
  });
}
