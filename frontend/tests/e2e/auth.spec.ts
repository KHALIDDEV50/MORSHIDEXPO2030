import { expect, test } from '@playwright/test';
import en from '../../messages/en.json';

/** Phase 11 — mock auth, guest gating, notifications, settings (PRD §4.5–4.7). */

test('guest save flow: save a proposal → sign-in sheet → demo account → the save completes', async ({ page }) => {
  await page.goto('/en/chat?demoProfile=guest');
  const box = page.getByRole('textbox').last();
  await box.fill(en.characters.arif.suggestions.s2.prompt);
  await box.press('Enter');

  const card = page.getByRole('region', { name: /Itinerary proposal: A heritage day in Riyadh/ });
  await card.getByRole('button', { name: en.proposal.save }).click({ timeout: 15_000 });

  const sheet = page.getByRole('dialog', { name: en.auth.sheetTitle });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: en.auth.useDemo }).click();
  await sheet.getByRole('button', { name: en.auth.submit.login }).click();

  await expect(sheet).toBeHidden();
  await expect(card.getByText(en.chatThread.proposal.saved)).toBeVisible();
});

test('login validates, then returns to where the visitor came from', async ({ page }) => {
  await page.goto('/en/login?next=%2Fplans');
  await page.getByRole('button', { name: en.auth.submit.login, exact: true }).click();
  await expect(page.getByText(en.auth.errors.emailRequired)).toBeVisible();
  await page.getByLabel(en.auth.fields.email).fill('visitor@example.com');
  await page.getByLabel(en.auth.fields.password).fill('longenough');
  await page.getByRole('button', { name: en.auth.submit.login, exact: true }).click();
  await expect(page).toHaveURL(/\/en\/plans$/);
});

test('notifications: unread badge, mark all as read', async ({ page }) => {
  await page.goto('/en/notifications');
  await expect(page.getByRole('button', { name: en.notifications.filterUnread.replace('{count}', '3') })).toBeVisible();
  await page.getByRole('button', { name: en.notifications.markAllRead }).click();
  await expect(page.getByRole('button', { name: en.notifications.filterUnread.replace('{count}', '0') })).toBeVisible();
});

test('settings: guests see the sign-in card; signed-in users can change password (demo) and sign out', async ({ page }) => {
  await page.goto('/en/settings?demoProfile=guest');
  await expect(page.getByText(en.settingsPage.guestTitle)).toBeVisible();

  await page.goto('/en/settings?demoProfile=free');
  await page.getByLabel(en.settingsPage.currentPassword).fill('oldpassword');
  await page.getByLabel(en.settingsPage.newPassword, { exact: true }).fill('newpassword');
  await page.getByLabel(en.settingsPage.confirmPassword).fill('newpassword');
  await page.getByRole('button', { name: en.settingsPage.changePassword }).click();
  await expect(page.getByText(en.settingsPage.passwordChanged)).toBeVisible();

  await page.getByRole('button', { name: en.settingsPage.signOut }).click();
  await expect(page).toHaveURL(/\/en\/chat/);
});
