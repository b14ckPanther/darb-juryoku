import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// Phase 3 click-through: every screen in demo mode, both themes, axe on each, then the phone checks.
const copy = parse(
  readFileSync(new URL('../../../config/copy/en.yaml', import.meta.url), 'utf8'),
) as {
  nav: Record<string, string>;
  demo: { banner: string };
  today: { title: string };
  history: { title: string };
  calibrate: { title: string };
  welcome: { title: string };
  states: { pending_action: string };
};

const screens: [string, string][] = [
  ['/', copy.nav['live'] ?? ''],
  ['/welcome', copy.welcome.title],
  ['/calibrate', copy.nav['calibrate'] ?? ''],
  ['/sentinel', copy.nav['sentinel'] ?? ''],
  ['/nudges', copy.nav['nudges'] ?? ''],
  ['/today', copy.today.title],
  ['/history', copy.history.title],
  ['/studio', copy.nav['studio'] ?? ''],
  ['/lab', copy.nav['lab'] ?? ''],
  ['/settings', copy.nav['settings'] ?? ''],
];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

for (const theme of ['dark', 'light']) {
  test(`every screen in demo mode, ${theme} theme: banner, heading, no serious axe issue`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('juryoku.theme', t);
      localStorage.setItem('juryoku.demo', '1');
    }, theme);
    for (const [path, heading] of screens) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole('note').first()).toContainText(copy.demo.banner);
      await page.waitForTimeout(250);
      expect(await axe(page), path).toEqual([]);
    }
  });
}

test('clicks through the app from the navigation, including a day report', async ({ page }) => {
  await page.goto('/?demo=1');
  const nav = page.getByRole('navigation', { name: copy.nav['label'] });
  for (const [, heading] of screens.filter(([p]) => p !== '/welcome')) {
    await nav.getByRole('link', { name: heading, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  await nav.getByRole('link', { name: copy.history.title }).click();
  await page.getByRole('button', { name: /^Friday 23 October/ }).click();
  await expect(page).toHaveURL(/\/history\/2026-10-23$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Friday 23 October' })).toBeVisible();
});

test('empty, loading and error states have no serious axe issue', async ({ page }) => {
  for (const state of ['empty', 'loading', 'error']) {
    await page.goto(`/today?demo=1&state=${state}`);
    await page.waitForTimeout(300);
    expect(await axe(page), state).toEqual([]);
  }
});

test('outside demo mode the seed is never downloaded and no banner shows', async ({ page }) => {
  const seedRequests: string[] = [];
  page.on('request', (r) => {
    if (/demo-seed/.test(r.url())) seedRequests.push(r.url());
  });
  await page.goto('/?demo=0');
  await expect(page.getByRole('heading', { level: 1, name: copy.welcome.title })).toBeVisible();
  for (const path of ['/today', '/history', '/lab', '/studio']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await page.waitForLoadState('networkidle');
  expect(seedRequests).toEqual([]);
  await expect(page.getByText(copy.demo.banner)).toHaveCount(0);
});

test('the demo makes no request that leaves the origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? '').origin;
  const off: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) off.push(r.url());
  });
  for (const [path] of screens) {
    await page.goto(`${path}?demo=1`);
    await page.waitForLoadState('networkidle');
  }
  expect(off).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the live mirror and its overlay honour it', async ({ page }) => {
    await page.goto('/?demo=1');
    await expect(page.locator('[data-reduced-motion="true"]').first()).toBeAttached();
  });
});

for (const width of [360, 390, 430]) {
  test.describe(`on a ${width} px phone`, () => {
    test.use({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true });

    test('the tab bar navigates, nothing scrolls sideways, and every target is 44 by 44', async ({
      page,
    }) => {
      await page.goto('/today?demo=1');
      const tabs = page.getByRole('navigation', { name: copy.nav['tabs_label'] });
      await expect(tabs).toBeVisible();
      for (const [path] of screens) {
        await page.goto(path);
        await page.waitForTimeout(200);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, path).toBeLessThanOrEqual(0);
        const small = await page.evaluate(() =>
          [
            ...document.querySelectorAll<HTMLElement>(
              'main button, main a, nav a, main [role="switch"]',
            ),
          ]
            .filter((el) => el.offsetParent !== null && !el.closest('[hidden], table, figcaption'))
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width > 0 && (r.width < 43.5 || r.height < 43.5))
            .map(
              ({ el, r }) =>
                `${el.textContent?.trim() || el.getAttribute('aria-label')} ${Math.round(r.width)}x${Math.round(r.height)}`,
            ),
        );
        expect(small, path).toEqual([]);
      }
      await page.goto('/today');
      await tabs.getByRole('link', { name: copy.history.title }).click();
      await expect(page.getByRole('heading', { level: 1, name: copy.history.title })).toBeVisible();
    });

    test('a sheet opens from the bottom and closes with Escape', async ({ page }) => {
      await page.goto('/settings?demo=1');
      await page
        .getByRole('button', { name: new RegExp(copy.nav['settings'] ? 'Nudge style' : '') })
        .click();
      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
    });
  });
}
