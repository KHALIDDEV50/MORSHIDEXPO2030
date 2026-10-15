import { expect, test } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const DICT = { ar, en } as const;
const DESTINATIONS = [
  { key: 'chat', path: '/chat' },
  { key: 'discover', path: '/discover' },
  { key: 'expo', path: '/expo' },
  { key: 'plans', path: '/plans' },
  { key: 'profile', path: '/settings' },
] as const;

/** Phase 3 (Gate D): rail ≥768px, bottom navigation <768px, active state, safe content area. */
for (const locale of ['ar', 'en'] as const) {
  const t = DICT[locale].nav;

  test(`navigation reaches every destination — ${locale}`, async ({ page }, testInfo) => {
    const narrow = (testInfo.project.use.viewport?.width ?? 1280) < 768;
    await page.goto(`/${locale}/chat`);
    const nav = page.getByRole('navigation', { name: t.mainLabel }).filter({ visible: true });
    await expect(nav).toHaveCount(1);

    for (const dest of DESTINATIONS) {
      await nav.getByRole('link', { name: new RegExp(t[dest.key]) }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}${dest.path}/?$`));
      await expect(nav.getByRole('link', { name: new RegExp(t[dest.key]) })).toHaveAttribute('aria-current', 'page');
    }

    // Bottom bar on phones, rail on wider screens
    const box = await nav.boundingBox();
    if (narrow) expect(box!.y).toBeGreaterThan(300);
    else expect(box!.height).toBeGreaterThan(400);
  });

  test(`sidebar order is Chat · Expo · Discover (P-025) — ${locale}`, async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 768, 'rail only on ≥768px');
    await page.goto(`/${locale}/chat`);
    const rail = page.getByRole('navigation', { name: t.mainLabel }).filter({ visible: true });
    const labels = await rail.getByRole('link').evaluateAll((links) => links.map((l) => l.getAttribute('aria-label')));
    const order = [t.chat, t.expo, t.discover].map((label) => labels.indexOf(label));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((x, y) => x - y));
  });

  test(`rail sits on the reading-start edge — ${locale}`, async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 768, 'rail only on ≥768px');
    await page.goto(`/${locale}/chat`);
    const rail = page.getByRole('navigation', { name: t.mainLabel }).filter({ visible: true });
    const box = await rail.boundingBox();
    const width = page.viewportSize()!.width;
    if (locale === 'ar') expect(box!.x + box!.width).toBeGreaterThan(width - 2);
    else expect(box!.x).toBeLessThan(2);
  });

  test(`sidebar collapses and expands, content follows — ${locale}`, async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 768, 'rail only on ≥768px');
    await page.goto(`/${locale}/chat`);
    const shell = DICT[locale].shell.sidebar;
    const rail = page.getByRole('navigation', { name: t.mainLabel }).filter({ visible: true });
    const toggle = rail.getByRole('button', { name: new RegExp(`${shell.collapse}|${shell.expand}`) });
    const startWidth = (await rail.boundingBox())!.width;
    await toggle.click();
    await page.waitForTimeout(400); // width transition
    const endWidth = (await rail.boundingBox())!.width;
    expect(Math.abs(endWidth - startWidth)).toBeGreaterThan(100);
    // Preference survives a reload
    await page.reload();
    await page.waitForTimeout(400);
    expect(Math.abs((await rail.boundingBox())!.width - endWidth)).toBeLessThan(2);
    // Main content is never under the rail
    const main = await page.locator('#main-content').boundingBox();
    const r = (await rail.boundingBox())!;
    if (locale === 'ar') expect(main!.x + main!.width).toBeLessThanOrEqual(r.x + 1);
    else expect(main!.x).toBeGreaterThanOrEqual(r.x + r.width - 1);
  });

  test(`desktop header shows credits and the account trigger — ${locale}`, async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 768, 'desktop header only');
    await page.goto(`/${locale}/chat?demoProfile=plus_expiring`);
    const shell = DICT[locale].shell;
    await expect(page.getByRole('link', { name: new RegExp(shell.credits.aria.split('{')[0]!.trim()) })).toBeVisible();
    // Expiry warning is computed from the demo end date (5 days from today)
    const expected = locale === 'ar' ? 'باقي 5 أيام على انتهاء اشتراكك' : 'Subscription expires in 5 days';
    await expect(page.getByRole('banner').getByText(expected)).toBeVisible();
    await page.getByRole('button', { name: new RegExp(shell.user.menuFor.split('{')[0]!.trim()) }).click();
    await page.getByRole('menuitem', { name: new RegExp(DICT[locale].language.label) }).click();
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toBeVisible();
  });

  test(`account submenus follow the open/close rules — ${locale}`, async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 768, 'desktop account menu only');
    await page.goto(`/${locale}/chat`);
    const d = DICT[locale];
    const account = page.getByRole('button', { name: new RegExp(d.shell.user.menuFor.split('{')[0]!.trim()) });
    const languageRow = page.getByRole('menuitem', { name: new RegExp(d.language.label) });
    const themeRow = page.getByRole('menuitem', { name: new RegExp(d.theme.label) });
    const menus = page.getByRole('menu');

    await account.click();
    await expect(menus).toHaveCount(1);

    // Open Language, then Theme: only one submenu at a time, main menu stays open
    await languageRow.click();
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toBeVisible();
    await themeRow.click();
    await expect(page.getByRole('menuitemradio', { name: d.theme.dark })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toHaveCount(0);
    await expect(menus).toHaveCount(2);

    // Clicking the open row toggles it closed
    await themeRow.click();
    await expect(menus).toHaveCount(1);

    // Escape: submenu first, then the main menu
    await themeRow.click();
    await expect(menus).toHaveCount(2);
    await page.keyboard.press('Escape');
    await expect(menus).toHaveCount(1);
    await expect(themeRow).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menus).toHaveCount(0);
    await expect(account).toBeFocused();

    // Selecting a theme applies it, closes the submenu, keeps the main menu open
    await account.click();
    await themeRow.click();
    await page.getByRole('menuitemradio', { name: d.theme.dark }).click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(menus).toHaveCount(1);

    // Clicking outside closes everything
    await page.mouse.click(5, 300);
    await expect(menus).toHaveCount(0);
  });

  test(`fixed navigation never covers the page content — ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/settings`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const last = page.locator('#main-content > *').last();
    const lastBox = await last.boundingBox();
    const nav = page.getByRole('navigation', { name: t.mainLabel }).filter({ visible: true });
    const navBox = await nav.boundingBox();
    if (lastBox && navBox && navBox.y > 300) {
      // Bottom bar: content must end above it
      expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navBox.y + 1);
    }
  });
}
