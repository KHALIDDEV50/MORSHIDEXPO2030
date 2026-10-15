import { expect, test } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/** Phase 10 — Expo 2030 (PRD §4.3). The layout is illustrative demo data and always labelled. */
for (const [locale, t] of [
  ['en', en],
  ['ar', ar],
] as const) {
  test(`Expo home: permanent illustrative labels, site plan and pavilion filters — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/expo`);
    await expect(page.getByRole('note').filter({ hasText: t.expoPage.disclaimer })).toBeVisible();
    await expect(page.getByText(t.map.illustrative)).toBeVisible();

    await page.getByRole('list', { name: t.expoPage.categoriesLabel }).getByRole('button', { name: t.expoMap.category.mobility }).click();
    const cards = page.getByRole('region', { name: t.expoPage.pavilionsTitle, exact: true }).getByRole('heading', { level: 3 });
    await expect(cards).toHaveCount(4); // 4.1–4.4 Future Mobility
  });
}

test('pavilion details: tabs, Expo-only Add to plan, show on the site plan', async ({ page }) => {
  await page.goto('/en/expo/booth_ai_experience');
  await expect(page.getByRole('heading', { level: 1, name: /AI Experience Hall/ })).toBeVisible();
  await page.getByRole('tab', { name: en.boothDetails.tabs.location }).click();
  await expect(page.getByText(en.map.illustrative)).toBeVisible();

  // Only Expo plans are offered (never mixed with tourism plans)
  await page.getByRole('button', { name: en.addToPlan.button }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Expo: AI & Tech half-day')).toBeVisible();
  await expect(dialog.getByText('Modern Riyadh evening')).toHaveCount(0);
  await dialog.getByRole('button', { name: en.addToPlan.cancel }).click();

  await page.getByRole('link', { name: en.boothDetails.showOnMap }).click();
  await expect(page).toHaveURL(/\/en\/expo\?focus=booth_ai_experience/);
  await expect(page.getByRole('region', { name: en.expoMap.detailsLabel })).toContainText('AI Experience Hall');
});

test('unknown pavilion ids are handled gracefully', async ({ page }) => {
  await page.goto('/en/expo/booth_does_not_exist');
  await expect(page.getByText(en.boothDetails.notFoundTitle)).toBeVisible();
});

test('Expo assistant: an interest chip opens the chat popup and a plan can be proposed', async ({ page }) => {
  await page.goto('/en/expo');
  await page.getByRole('button', { name: en.expoPage.assistant.topics.stage }).click();
  const popup = page.getByRole('dialog', { name: en.expoPage.assistant.dockLabel });
  await expect(popup.getByText(/Main Stage/).first()).toBeVisible({ timeout: 15_000 });
  await popup.getByRole('textbox').fill(en.expoPage.assistant.planPrompt);
  await popup.getByRole('textbox').press('Enter');
  await expect(popup.getByRole('region', { name: /Itinerary proposal/ })).toBeVisible({ timeout: 15_000 });
});

test('pavilion page: the bottom chat entry opens a popup with the pavilion as context', async ({ page }) => {
  await page.goto('/en/expo/booth_main_stage');
  await page.getByRole('button', { name: en.chatDock.booth.label.replace('{name}', '5.1 · Main Stage') }).click();
  const popup = page.getByRole('dialog', { name: en.chatDock.booth.label.replace('{name}', '5.1 · Main Stage') });
  await expect(popup.getByText(en.chatDock.booth.context.replace('{name}', '5.1 · Main Stage'))).toBeVisible();
  await expect(page).toHaveURL(/\/en\/expo\/booth_main_stage/);
});
