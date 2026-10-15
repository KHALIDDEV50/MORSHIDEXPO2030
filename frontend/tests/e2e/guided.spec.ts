import { expect, test } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/** Phase 9 — Guided mode (D-017–D-019): start → complete all → Completed tab. */
for (const [locale, t] of [
  ['en', en],
  ['ar', ar],
] as const) {
  test(`start a plan, complete every stop, find it under Completed — ${locale}`, async ({ page }, testInfo) => {
    await page.goto(`/${locale}/plans/plan_modern_evening`);
    await page.getByRole('button', { name: t.planDetails.startPlan }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/plans/plan_modern_evening/guide`));

    // The phone bottom nav is hidden in guided mode (D-015)
    if ((testInfo.project.use.viewport?.width ?? 1280) < 768) {
      await expect(page.getByRole('navigation', { name: t.nav.mainLabel }).filter({ visible: true })).toHaveCount(0);
    }

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: t.guided.markDone }).click();
    }
    await expect(page.getByRole('heading', { name: t.guided.completedTitle })).toBeVisible();
    await page.getByRole('link', { name: t.guided.toCompleted }).click();
    await expect(page).toHaveURL(/tab=completed/);
    await expect(page.getByRole('link', { name: /Modern Riyadh evening/ }).first()).toBeVisible();
  });
}

test('Google Maps link only for tourism stops, and skip moves to the next stop', async ({ page }) => {
  await page.goto('/en/plans/plan_modern_evening/guide');
  const link = page.getByRole('link', { name: en.guided.googleMaps });
  await expect(link).toHaveAttribute('href', /google\.com\/maps\/dir\/\?api=1&destination=/);
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(page.getByText(en.guided.position.replace('{position}', '1').replace('{total}', '3'))).toBeVisible();
  await page.getByRole('button', { name: en.guided.skip }).click();
  await expect(page.getByText(en.guided.position.replace('{position}', '2').replace('{total}', '3'))).toBeVisible();

  await page.goto('/en/plans/plan_expo_ai/guide');
  await expect(page.getByText(en.guided.expoNote)).toBeVisible();
  await expect(page.getByRole('link', { name: en.guided.googleMaps })).toHaveCount(0);
});
