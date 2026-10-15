import { expect, test, type Page } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/** Phase 7 — Chat (PRD §4.1). Demo assistant: canned scenarios with simulated streaming. */

async function send(page: Page, text: string) {
  const box = page.getByRole('textbox').last();
  await box.fill(text);
  await box.press('Enter');
}

test('S7 half-day Expo itinerary → save → open plan (saved exactly once)', async ({ page }) => {
  await page.goto('/en/chat');
  await send(page, en.characters.roaya.suggestions.s2.prompt);

  const card = page.getByRole('region', { name: /Itinerary proposal: Expo half-day/ });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: en.proposal.save }).click();
  await expect(card.getByText(en.chatThread.proposal.saved)).toBeVisible();

  // Persisted: still saved after a reload, and exactly one plan exists for this proposal
  await page.reload();
  await expect(page.getByRole('region', { name: /Itinerary proposal: Expo half-day/ }).getByText(en.chatThread.proposal.saved)).toBeVisible();
  const plans = await page.evaluate(() => JSON.parse(localStorage.getItem('morshid:v1:plans-v3') ?? '[]') as { name: string; sourceProposalId?: string }[]);
  expect(plans.filter((p) => p.name === 'Expo half-day: AI & Tech' && p.sourceProposalId)).toHaveLength(1);

  await page.getByRole('region', { name: /Itinerary proposal: Expo half-day/ }).getByRole('button', { name: en.proposal.openPlan }).click();
  await expect(page).toHaveURL(/\/en\/plans\/plan_/);
  await expect(page.getByRole('heading', { level: 1, name: 'Expo half-day: AI & Tech' })).toBeVisible();
});

test('Arabic: S8 heritage itinerary renders right-to-left', async ({ page }) => {
  await page.goto('/ar/chat');
  await send(page, ar.characters.arif.suggestions.s2.prompt);
  await expect(page.getByRole('region', { name: /خطة مقترحة: يوم تراثي في الرياض/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('unsupported questions get the honest fallback', async ({ page }) => {
  await page.goto('/en/chat');
  await send(page, 'What will the weather be tomorrow?');
  await expect(page.getByText(/This is a demo with predefined replies/)).toBeVisible({ timeout: 15_000 });
});

test('rename and delete persist across reloads', async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 0) < 1024, 'history side panel is desktop (drawer below lg)');
  await page.goto('/en/chat?c=conv_masmak_history');
  const history = page.getByRole('navigation', { name: en.chatHistory.label });
  await history.getByRole('button', { name: en.chatHistory.actionsFor.replace('{title}', 'Masmak Fortress history') }).click();
  await page.getByRole('menuitem', { name: en.chatHistory.rename }).click();
  await page.getByRole('textbox', { name: en.chatHistory.titleLabel }).fill('Masmak notes');
  await page.getByRole('button', { name: en.chatHistory.save }).click();

  await page.reload();
  await expect(history.getByRole('button', { name: 'Masmak notes' })).toBeVisible();

  await history.getByRole('button', { name: en.chatHistory.actionsFor.replace('{title}', 'Masmak notes') }).click();
  await page.getByRole('menuitem', { name: en.chatHistory.delete }).click();
  await page.getByRole('dialog').getByRole('button', { name: en.chatHistory.delete }).click();
  await page.reload();
  await expect(history.getByRole('button', { name: 'Masmak notes' })).toHaveCount(0);
});

test('switching character changes identity and opens their latest conversation', async ({ page }) => {
  await page.goto('/en/chat');
  await page.getByRole('button', { name: en.characters.switchTo.replace('{name}', en.characters.roaya.name) }).first().click();
  // Roaya's most recent demo conversation opens (PRD §4.1)
  await expect(page).toHaveURL(/c=conv_expo_ai/);
  await expect(page.getByText(en.characters.roaya.name).first()).toBeVisible();
});

test('recommendation → summary popup → full details → chat shortcut → chat with the place as context', async ({ page }) => {
  await page.goto('/en/chat');
  await send(page, en.characters.arif.suggestions.s1.prompt);

  // The place name in the recommendation opens the summary popup
  await page.getByRole('button', { name: 'Masmak Fortress', exact: true }).first().click({ timeout: 15_000 });
  const dialog = page.getByRole('dialog', { name: 'Masmak Fortress' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(en.placeSummary.hoursDemo)).toBeVisible();
  await dialog.getByRole('button', { name: en.placeSummary.openFull }).click();

  await expect(page).toHaveURL(/\/en\/discover\/plc_masmak/);
  // The corner launcher opens the chat popup about this place (no navigation); Expand / Collapse keep the conversation
  const label = en.placeChat.label.replace('{place}', 'Masmak Fortress');
  await page.getByRole('button', { name: label }).click();
  const popup = page.getByRole('dialog', { name: label });
  await expect(popup.getByText(en.placeChat.contextChip.replace('{place}', 'Masmak Fortress'))).toBeVisible();
  await popup.getByRole('button', { name: en.placeChat.suggestions.history.replace('{name}', 'Masmak Fortress') }).click();
  await expect(popup.getByText(/Masmak/).nth(1)).toBeVisible({ timeout: 15_000 });
  await popup.getByRole('button', { name: en.chatDock.expand }).click();
  await expect(popup).toHaveAttribute('aria-modal', 'true');
  await popup.getByRole('button', { name: en.chatDock.collapse }).click();
  await expect(popup.getByRole('textbox')).toBeVisible();
  await popup.getByRole('button', { name: en.chatDock.close }).click();
  await expect(popup).toBeHidden();
  await expect(page).toHaveURL(/\/en\/discover\/plc_masmak/);
});

test('chat map: place details float over the map and close back to it', async ({ page }) => {
  await page.goto('/en/chat');
  await send(page, en.characters.arif.suggestions.s1.prompt);
  await page.getByRole('button', { name: en.chatThread.showOnMap }).first().click({ timeout: 15_000 });
  await expect(page).toHaveURL(/view=map/);
  const popup = page.getByRole('dialog', { name: 'Masmak Fortress' });
  await expect(popup).toBeVisible();
  await expect(popup.getByRole('button', { name: en.chatPage.openFullDetails })).toBeVisible();
  await popup.getByRole('button', { name: en.place.close }).click();
  await expect(popup).toBeHidden();
  await expect(page).toHaveURL(/view=map/);
});

test('mode bar: Chat · Explore Map · Expo Map keep ?c=, and Back / Forward move between modes', async ({ page }) => {
  await page.goto('/en/chat');
  await send(page, en.characters.arif.suggestions.s1.prompt);
  await expect(page).toHaveURL(/c=conv_/, { timeout: 15_000 });
  const c = new URL(page.url()).searchParams.get('c');
  const nav = page.getByRole('group', { name: en.chatPage.viewLabel });
  const chatMode = en.chatPage.modes.chat.replace('{name}', en.characters.arif.name);

  await nav.getByRole('radio', { name: en.chatPage.modes.expo }).click();
  await expect(page).toHaveURL(new RegExp(`/en/chat\?c=${c}&view=expo`));
  await expect(nav.getByRole('radio', { name: en.chatPage.modes.expo })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: en.chatPage.expoTitle })).toBeVisible();

  await nav.getByRole('radio', { name: en.chatPage.modes.map }).click();
  await expect(page).toHaveURL(/view=map/);
  await page.goBack();
  await expect(page).toHaveURL(/view=expo/);
  await page.goBack();
  await expect(page).not.toHaveURL(/view=/);
  await expect(nav.getByRole('radio', { name: chatMode })).toHaveAttribute('aria-checked', 'true');
  await expect(page).toHaveURL(new RegExp(`c=${c}`));
});

test('direct link to an unknown conversation still opens the Expo map', async ({ page }) => {
  await page.goto('/ar/chat?c=conv_does_not_exist&view=expo');
  await expect(page.getByRole('heading', { name: (await import('../../messages/ar.json')).default.chatPage.expoTitle })).toBeVisible();
});

test('Plan a trip: ask the companion for a plan from any mode', async ({ page }) => {
  await page.goto('/en/chat?view=map');
  await page.getByRole('button', { name: en.chatPage.planTrip.button }).click();
  await page.getByRole('menuitem', { name: en.chatPage.planTrip.askRiyadh.replace('{name}', en.characters.arif.name) }).click();
  await expect(page).not.toHaveURL(/view=/);
  await expect(page.getByRole('region', { name: /Itinerary proposal/ })).toBeVisible({ timeout: 15_000 });
});
