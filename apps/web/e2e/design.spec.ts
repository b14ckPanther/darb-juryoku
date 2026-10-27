import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/design', '/design/components', '/design/overlay', '/design/mobile'];

for (const theme of ['dark', 'light']) {
  for (const route of routes) {
    test(`${route} in the ${theme} theme has no serious or critical axe violations`, async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem('juryoku.theme', t), theme);
      await page.goto(route);
      await expect(page.getByRole('note').first()).toBeVisible();
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
}

test('the design routes make no request that leaves the origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? '').origin;
  const offOrigin: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) offOrigin.push(r.url());
  });
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }
  expect(offOrigin).toEqual([]);
});

test('every demo page says it shows demo data', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole('note').first()).toContainText(/demo/i);
  }
});

test('the brand fonts load from the app', async ({ page }) => {
  await page.goto('/design');
  const loaded = await page.evaluate(async () => {
    const load = async (font: string) => (await document.fonts.load(font)).map((f) => f.status);
    return [await load('600 32px "Zen Old Mincho"'), await load('400 16px "Geist"')];
  });
  expect(loaded).toEqual([['loaded'], ['loaded']]);
});

test.describe('on a 390 px phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('every control on the phone screen is at least 44 by 44', async ({ page }) => {
    await page.goto('/design/mobile');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main button, main a, nav a, input')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width < 44 || r.height < 44)
        .map(
          ({ el, r }) =>
            `${el.textContent?.trim() || el.getAttribute('aria-label')}: ${Math.round(r.width)}x${Math.round(r.height)}`,
        ),
    );
    expect(small).toEqual([]);
  });

  test('the page never scrolls sideways', async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, route).toBeLessThanOrEqual(0);
    }
  });

  test('the sheet opens, traps focus and closes on Escape', async ({ page }) => {
    await page.goto('/design/mobile');
    const opener = page.getByRole('button', { name: /nudge style/i });
    await opener.click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('radio').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('the sheet content ends on screen at its lower detent', async ({ page }) => {
    await page.goto('/design/mobile');
    await page.getByRole('button', { name: /nudge style/i }).click();
    const radios = page.getByRole('dialog').getByRole('radio');
    await expect(radios.last()).toBeVisible();
    await page.waitForTimeout(600);
    const box = await radios.last().boundingBox();
    expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
  });

  test('the large title collapses into the compact bar on scroll', async ({ page }) => {
    await page.goto('/design/mobile');
    const compact = page
      .locator('[aria-hidden]')
      .filter({ hasText: /^Today$/ })
      .first();
    await expect(compact).toHaveAttribute('aria-hidden', 'true');
    await page.mouse.wheel(0, 600);
    await expect(compact).toHaveAttribute('aria-hidden', 'false');
  });
});
