import { expect, test } from '@playwright/test';
import en from '../../messages/en.json';

/** Phase 8 — My Plans (PRD §4.4). */
const t = en;

test('create a plan in the editor, see it in details, complete a stop with undo, then delete it', async ({ page }) => {
  await page.goto('/en/plans/new');
  await page.getByLabel(t.planEditor.name).fill('Museum morning');
  await page.getByRole('searchbox').last().fill('museum');
  await page.getByRole('list', { name: t.planEditor.searchResults }).getByRole('button', { name: t.planEditor.add }).first().click();
  await page.getByRole('button', { name: t.planEditor.save, exact: true }).click();

  await expect(page).toHaveURL(/\/en\/plans\/plan_/);
  await expect(page.getByRole('heading', { level: 1, name: 'Museum morning' })).toBeVisible();

  // Step cards: details expand inline (no navigation); manual completion with Undo (PRD §4.4)
  await page.getByRole('button', { name: t.planSteps.viewDetails }).first().click();
  await expect(page.getByText(t.planSteps.visitInfo).first()).toBeVisible();
  await expect(page).toHaveURL(/\/en\/plans\/plan_/);
  await page.getByRole('button', { name: t.planSteps.markDone }).first().click();
  await expect(page.getByText(/marked as done/)).toBeVisible();
  await page.getByRole('button', { name: t.managePlan.undo }).click();

  await page.getByRole('button', { name: t.planDetails.delete }).click();
  await page.getByRole('dialog').getByRole('button', { name: t.managePlan.delete }).click();
  await expect(page).toHaveURL(/\/en\/plans$/);
  await expect(page.getByText('Museum morning')).toHaveCount(0);
});

test('tabs filter plans and a completed plan shows under Completed', async ({ page }) => {
  await page.goto('/en/plans?tab=completed');
  await expect(page.getByRole('link', { name: /Diriyah/ }).first()).toBeVisible();
  await page.getByRole('tab', { name: t.plansPage.tabs.drafts }).click();
  await expect(page).toHaveURL(/tab=drafts/);
  await expect(page.getByRole('link', { name: /Weekend road trip/ }).first()).toBeVisible();
});

test('copy a featured plan into my plans (opens the editor as a draft)', async ({ page }) => {
  await page.goto('/en/plans');
  await page.getByRole('button', { name: t.plansPage.copy }).first().click();
  await expect(page).toHaveURL(/\/en\/plans\/plan_.*\/edit/);
  await expect(page.getByLabel(t.planEditor.name)).toHaveValue('Riyadh heritage day');
});

test('replace a step with a demo alternative, keep the rest of the plan, then undo', async ({ page }) => {
  await page.goto('/en/plans/plan_heritage_day');
  await expect(page.getByRole('heading', { level: 3, name: 'Murabba Palace' })).toBeVisible();
  const before = await page.getByRole('heading', { level: 3 }).count();

  await page.getByRole('button', { name: t.planSteps.replace }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(t.managePlan.replace.demoNote)).toBeVisible();
  await dialog.getByRole('radio').first().check();
  await dialog.getByRole('button', { name: t.managePlan.replace.confirm }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(before);
  await page.getByRole('button', { name: t.managePlan.replace.undo }).click();
});
