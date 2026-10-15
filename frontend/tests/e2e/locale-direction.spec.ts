import { expect, test } from '@playwright/test';

/*
 * Updated in Phase 3 (D-039: tests change only when intended behavior changes):
 * the language switch is the shell's LanguageSwitcher menu instead of the retired Phase 1
 * scaffold link. Updated 2026-10-12: the locale root is now the landing page (not a redirect
 * to /[locale]/chat); its main call to action opens Chat. Updated again 2026-10-12 for the
 * public website: that call to action is now "Start exploring" (still opens Chat).
 */
test.describe('Locale routing and direction', () => {
  test.describe('root follows the browser language to the landing page', () => {
    test.describe('Arabic browser', () => {
      test.use({ locale: 'ar-SA' });
      test('goes to /ar', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/ar\/?$/);
      });
    });
    test.describe('English browser', () => {
      test.use({ locale: 'en-US' });
      test('goes to /en and the main call to action opens Chat', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/en\/?$/);
        await page.getByRole('main').getByRole('link', { name: 'Start exploring' }).first().click();
        await expect(page).toHaveURL(/\/en\/chat\/?$/);
      });
    });
  });

  test('Arabic renders right-to-left', async ({ page }) => {
    await page.goto('/ar');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('English renders left-to-right', async ({ page }) => {
    await page.goto('/en');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', 'ltr');
  });

  test('language switch keeps the current page', async ({ page }, testInfo) => {
    await page.goto('/ar/discover');
    if ((testInfo.project.use.viewport?.width ?? 1280) < 768) {
      // Phones: header language button (approved mobile layout)
      await page.getByRole('button', { name: 'تغيير اللغة' }).click();
      await page.getByRole('menuitem', { name: 'English' }).click();
    } else {
      // Desktop: language submenu inside the account menu (Gate D refinement)
      await page.getByRole('button', { name: /قائمة حساب/ }).click();
      await page.getByRole('menuitem', { name: /تغيير اللغة/ }).click();
      await page.getByRole('menuitemradio', { name: 'English' }).click();
    }
    await expect(page).toHaveURL(/\/en\/discover\/?$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('no horizontal overflow at this viewport', async ({ page }) => {
    for (const locale of ['ar', 'en']) {
      for (const path of ['', '/chat']) {
        await page.goto(`/${locale}${path}`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${locale}${path}`).toBeLessThanOrEqual(0);
      }
    }
  });

  test('display and body fonts are applied', async ({ page }) => {
    await page.goto('/ar/chat');
    const headingFont = await page
      .getByRole('heading', { level: 1 })
      .evaluate((el) => getComputedStyle(el).fontFamily);
    const bodyFont = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont.toLowerCase()).toContain('cairo');
    expect(bodyFont.toLowerCase()).toContain('tajawal');
  });
});
