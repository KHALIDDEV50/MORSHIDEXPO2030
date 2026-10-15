import { expect, test } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/** Phase 6 — Discover (PRD §4.2). The map view loads OpenFreeMap tiles over the network. */
const DICT = { ar, en } as const;
const MASMAK = { ar: 'قصر المصمك', en: 'Masmak Fortress' } as const;

for (const locale of ['ar', 'en'] as const) {
  const d = DICT[locale];
  const t = d.discoverPage;

  test(`search → place details → add to plan — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/discover`);
    await page.getByRole('searchbox', { name: t.searchLabel }).fill(locale === 'ar' ? 'المصمك' : 'masmak');
    await expect(page).toHaveURL(/[?&]q=/);

    await page.getByRole('button', { name: t.openDetails.replace('{name}', MASMAK[locale]) }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/discover/plc_masmak`));
    await expect(page.getByRole('heading', { level: 1, name: MASMAK[locale] })).toBeVisible();
    // Opening hours are always labelled demo (PRD §3)
    await expect(page.getByText(d.placeDetails.hoursDemo).first()).toBeVisible();

    // Add to a NEW plan (Masmak is already in the demo heritage plan, so that option is disabled)
    await page.getByRole('button', { name: d.addToPlan.button }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(d.addToPlan.alreadyIn)).toBeVisible();
    await dialog.getByRole('radio').last().check();
    await dialog.getByRole('button', { name: d.addToPlan.confirm }).click();
    await expect(page.getByText(new RegExp(MASMAK[locale])).last()).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test(`filters drive the results and survive a reload — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/discover?region=saudi`);
    await expect(page.getByText(t.resultsCount.replace(/\{count, plural.*/, '')).first()).toBeVisible();
    const cards = page.getByRole('button', { name: new RegExp(t.openDetails.split('{name}')[0]!) });
    await expect(cards).toHaveCount(3); // Hegra, Historic Jeddah, Al-Soudah

    await page.reload();
    await expect(cards).toHaveCount(3);
  });

  test(`map view and "Search this area" — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/discover?view=map`);
    const map = page.getByRole('region', { name: t.mapLabel, exact: true });
    await expect(map.locator('canvas.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(map.getByRole('button', { name: MASMAK[locale] })).toBeVisible();

    // Pan a little, then limit results to the visible area
    await map.locator('canvas.maplibregl-canvas').focus();
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: t.searchThisArea }).click();
    await expect(page).toHaveURL(/[?&]area=/);
    await expect(page.getByText(t.areaChip)).toBeVisible();
  });

  test(`Expo chip goes to the Expo destination — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/discover`);
    await page.getByRole('link', { name: t.expoChip }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/expo`));
  });
}

test('location filter: All · Riyadh · Outside Riyadh updates the cards and shows the active option', async ({ page }) => {
  await page.goto('/en/discover');
  const region = page.getByRole('group', { name: en.discover.regionLabel }).first();
  await region.getByRole('radio', { name: en.discover.region.saudi }).click();
  await expect(page).toHaveURL(/region=saudi/);
  await expect(region.getByRole('radio', { name: en.discover.region.saudi })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: 'Hegra' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Masmak Fortress' })).toHaveCount(0);

  await page.getByRole('group', { name: en.discover.regionLabel }).first().getByRole('radio', { name: en.discover.region.riyadh }).click();
  await expect(page).toHaveURL(/region=riyadh/);
  await expect(page.getByRole('heading', { name: 'Masmak Fortress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hegra' })).toHaveCount(0);
});

test('licensed destination photos show with their credit on the details page', async ({ page }) => {
  await page.goto('/en/discover/plc_hegra');
  await expect(page.getByRole('img', { name: /Nabataean tomb/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Wikimedia Commons/ })).toHaveAttribute('href', /commons\.wikimedia\.org/);
});
