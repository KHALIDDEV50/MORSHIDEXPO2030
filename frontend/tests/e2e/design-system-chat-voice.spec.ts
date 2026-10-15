import { expect, test, type Page } from '@playwright/test';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const DICT = { ar, en } as const;
const LOCALES = ['ar', 'en'] as const;
const THEMES = ['light', 'dark'] as const;

async function openGallery(page: Page, locale: 'ar' | 'en', theme: 'light' | 'dark', hash = '') {
  await page.addInitScript((t) => window.localStorage.setItem('theme', t), theme);
  await page.goto(`/${locale}/dev/design-system${hash}`);
  await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
}

// ───────────── Viewport checks on every project (360 → 1536) ─────────────
for (const locale of LOCALES) {
  for (const theme of THEMES) {
    test(`gallery has no horizontal overflow — ${locale} ${theme}`, async ({ page }) => {
      await openGallery(page, locale, theme);
      await page.locator('#chat').scrollIntoViewIfNeeded();
      // Check both edges: in RTL, overflow goes to the left and doesn't change scrollWidth.
      const offenders = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const clipped = (el: Element) => {
          for (let p = el.parentElement; p; p = p.parentElement) {
            if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(p).overflowX)) return true;
          }
          return false;
        };
        return [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !clipped(el);
          })
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`)
          .slice(0, 5);
      });
      expect(offenders).toEqual([]);
    });
  }
}

// ───────────── Trip details & voice mode (one phone + one desktop project) ─────────────
test.describe('trip details & voice mode', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'interaction checks run on two viewports');
  });

  for (const locale of LOCALES) {
    const t = DICT[locale];
    const stops = t.designSystem.trip.stops;

    test(`trip: marker ↔ timeline sync, complete, remove — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'dark', '#trip');
      const trip = page.getByRole('region', { name: t.designSystem.trip.planTitle }).first();
      const progress = trip.getByRole('progressbar');
      await expect(progress).toHaveAttribute('aria-valuenow', '1');

      // Map marker → timeline item expands
      const murabbaMarker = trip.getByRole('button', { name: new RegExp(stops.murabba.name) }).first();
      await murabbaMarker.click();
      await expect(murabbaMarker).toHaveAttribute('aria-pressed', 'true');
      const timeline = trip.getByRole('list', { name: t.trip.timeline.label });
      const murabbaItem = timeline.getByRole('listitem').filter({ hasText: stops.murabba.name });
      await expect(murabbaItem.getByText(stops.murabba.description)).toBeVisible();
      await expect(murabbaItem.getByText(t.trip.status.overdue)).toBeVisible();

      // Complete it → progress updates
      await murabbaItem.getByRole('button', { name: t.trip.actions.complete }).click();
      await expect(progress).toHaveAttribute('aria-valuenow', '2');

      // Remove the lunch break → total drops, item disappears
      await trip.getByRole('button', { name: new RegExp(stops.lunch.name) }).first().click();
      const lunchItem = timeline.getByRole('listitem').filter({ hasText: stops.lunch.name });
      await lunchItem.getByRole('button', { name: t.trip.actions.remove }).click();
      await expect(lunchItem).toHaveCount(0);
      await expect(progress).toHaveAttribute('aria-valuemax', '5');
    });

    test(`trip: location denied falls back to manual stop choice — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'light', '#trip');
      await page.getByRole('radiogroup', { name: t.designSystem.trip.location }).getByRole('radio', { name: t.designSystem.trip.locationModes.denied }).click();
      const trip = page.getByRole('region', { name: t.designSystem.trip.planTitle }).first();
      await trip.getByRole('button', { name: t.trip.locate.whereAmI }).click();
      await expect(trip.getByRole('alert')).toContainText(t.trip.locate.errors['permission-denied'].title);
      await expect(trip.getByRole('button', { name: t.trip.locate.chooseManually })).toBeVisible();
    });

    test(`voice mode: open, talk, review, send, speak, exit — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'dark', '#voiceMode');
      const arif = t.characters.arif.name;
      await page.getByRole('button', { name: t.designSystem.voiceMode.openWith.replace('{name}', arif) }).click();
      const dialog = page.getByRole('dialog', { name: t.voiceMode.dialogTitle.replace('{name}', arif) });
      await expect(dialog).toBeVisible();

      await dialog.getByRole('button', { name: t.voiceMode.startListening.replace('{name}', arif) }).click();
      await expect(dialog.getByRole('status')).toContainText(t.voiceMode.status.listening);
      await page.waitForTimeout(900);
      await dialog.getByRole('button', { name: t.voiceMode.stopListening }).click();
      await expect(dialog.getByLabel(t.voiceMode.reviewLabel)).toHaveValue(t.designSystem.voiceMode.sampleHeard);

      await dialog.getByRole('button', { name: t.voiceMode.send.replace('{name}', arif) }).click();
      await expect(dialog.getByRole('status')).toContainText(t.voiceMode.status.speaking.replace('{name}', arif), { timeout: 5000 });
      await dialog.getByRole('button', { name: t.voice.output.pause, exact: true }).click();
      await expect(dialog.getByRole('status')).toContainText(t.voiceMode.status.paused);

      // Esc exits voice mode (no recording in progress)
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    });

    test(`voice mode: state board shows every state — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'light', '#voiceMode');
      for (const key of Object.keys(t.designSystem.voiceMode.stateLabels) as (keyof typeof t.designSystem.voiceMode.stateLabels)[]) {
        await expect(page.locator('#voiceMode').getByRole('figure', { name: t.designSystem.voiceMode.stateLabels[key], exact: true })).toBeVisible();
      }
    });
  }
});

// ───────────── Interaction checks (one phone + one desktop project) ─────────────
test.describe('chat & voice interactions', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(testInfo.project.name), 'interaction checks run on two viewports');
  });

  for (const locale of LOCALES) {
    const t = DICT[locale];

    test(`welcome → active conversation — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'light', '#chat');
      const welcome = page.getByRole('region', { name: t.chat.welcome.label.replace('{name}', t.characters.arif.name) }).first();
      await expect(welcome).toBeVisible();
      await welcome.getByRole('button', { name: new RegExp(t.characters.arif.suggestions.s1.title) }).click();
      // Active conversation: compact header with "new conversation", hero gone
      await expect(page.getByRole('button', { name: t.designSystem.chatPatterns.newConversation }).first()).toBeVisible();
      await expect(page.getByText(t.characters.arif.suggestions.s1.prompt).first()).toBeVisible();
    });

    test(`voice input — permission denied, cancel — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'dark', '#chat');
      const block = page.getByTestId('simulated-voice-input');
      const scenarioGroup = page.getByRole('radiogroup', { name: t.designSystem.voice.scenario }).first();

      await scenarioGroup.getByRole('radio', { name: t.designSystem.voice.inputScenarios['permission-denied'] }).click();
      await block.getByRole('button', { name: t.voice.input.start }).click();
      await expect(block.getByRole('alert')).toContainText(t.voice.input.errors['permission-denied'].title);

      await scenarioGroup.getByRole('radio', { name: t.designSystem.voice.inputScenarios.unsupported }).click();
      await block.getByRole('button', { name: t.voice.input.start }).click();
      await expect(block.getByRole('alert')).toContainText(t.voice.input.errors.unsupported.title);

      await scenarioGroup.getByRole('radio', { name: t.designSystem.voice.inputScenarios.success }).click();
      await block.getByRole('button', { name: t.voice.input.start }).click();
      const recorder = block.getByRole('group', { name: t.voice.input.recordingGroup });
      await expect(recorder).toBeVisible();
      await block.getByRole('button', { name: t.voice.input.cancel }).click();
      await expect(recorder).toBeHidden();
      await expect(block.getByRole('textbox')).toHaveValue('');

      await block.getByRole('button', { name: t.voice.input.start }).click();
      await page.waitForTimeout(900);
      await block.getByRole('button', { name: t.voice.input.stop }).click();
      await expect(block.getByRole('textbox')).toHaveValue(t.designSystem.voice.simulatedTranscript);
    });

    test(`voice output — play, pause, resume, stop, fallback — ${locale}`, async ({ page }) => {
      await openGallery(page, locale, 'light', '#chat');
      const block = page.getByTestId('simulated-voice-output');
      const listenArif = block.getByRole('button', { name: t.voice.output.listenLabel.replace('{name}', t.characters.arif.name) });
      const listenRoaya = block.getByRole('button', { name: t.voice.output.listenLabel.replace('{name}', t.characters.roaya.name) });

      await listenArif.click();
      const controls = block.getByRole('group', { name: t.voice.output.controlsLabel });
      await expect(controls).toHaveCount(1);
      await controls.getByRole('button', { name: t.voice.output.pause }).click();
      await controls.getByRole('button', { name: t.voice.output.resume }).click();
      await expect(controls.getByRole('button', { name: t.voice.output.pause })).toBeVisible();

      // Starting another message stops the first one
      await listenRoaya.click();
      await expect(block.getByRole('group', { name: t.voice.output.controlsLabel })).toHaveCount(1);
      await expect(listenArif).toBeVisible();
      await block.getByRole('button', { name: t.voice.output.stop, exact: true }).click();
      await expect(block.getByRole('group', { name: t.voice.output.controlsLabel })).toHaveCount(0);

      // Unsupported fallback
      const outputScenarios = page.getByRole('radiogroup', { name: t.designSystem.voice.scenario }).nth(1);
      await outputScenarios.getByRole('radio', { name: t.designSystem.voice.outputScenarios.unsupported }).click();
      await expect(block.getByRole('button', { name: t.voice.output.unavailableLabel })).toHaveCount(2);
    });
  }
});
