import { expect, test, type Page } from '@playwright/test';

// The golden outline, measured from its own pixels: gold glow follows the match, amber appears only
// with drift, and reduced motion holds still. Runs on the WebGL renderer and on the 2D fallback.

interface Stats {
  gold: number;
  warm: number;
  hash: number;
}

async function open(page: Page, renderer: string, m: number, motion: 'full' | 'reduced') {
  await page.goto(`/design/overlay?m=${m}&renderer=${renderer}&motion=${motion}&capture=1`);
  await expect(page.locator(`[data-settled-match="${m}"]`)).toBeVisible();
  await expect(page.locator('[data-renderer]')).toHaveAttribute('data-renderer', renderer);
}

function stats(page: Page): Promise<Stats> {
  return page.evaluate(() => {
    const src = document.querySelector<HTMLCanvasElement>('[data-renderer] canvas');
    if (!src) throw new Error('overlay canvas missing');
    const copy = document.createElement('canvas');
    copy.width = src.width;
    copy.height = src.height;
    const ctx = copy.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let gold = 0;
    let warm = 0;
    let hash = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;
      hash = (hash * 31 + r + g * 7 + b * 13) % 2147483647;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max < 120 || max !== r || (max - min) / max < 0.35) continue;
      const hue = (60 * (g - b)) / (max - min);
      if (hue >= 33 && hue <= 55) gold++;
      else if (hue >= 8 && hue < 30) warm++;
    }
    return { gold, warm, hash };
  });
}

for (const renderer of ['webgl', 'canvas']) {
  test.describe(`golden outline (${renderer})`, () => {
    test('the gold glow grows with the match', async ({ page }) => {
      const at: Record<number, Stats> = {};
      for (const m of [0, 0.5, 1]) {
        await open(page, renderer, m, 'reduced');
        at[m] = await stats(page);
      }
      expect(at[1]?.gold).toBeGreaterThan(2 * (at[0.5]?.gold ?? 0));
      expect(at[1]?.gold).toBeGreaterThan(2 * (at[0]?.gold ?? 0));
    });

    test('amber appears on the outline only when drifting', async ({ page }) => {
      await open(page, renderer, 0, 'reduced');
      const drifted = await stats(page);
      await open(page, renderer, 1, 'reduced');
      const matched = await stats(page);
      expect(drifted.warm).toBeGreaterThan(50);
      expect(matched.warm).toBeLessThan(drifted.warm / 10);
    });

    test('reduced motion holds still; full motion moves the outline', async ({ page }) => {
      await open(page, renderer, 1, 'reduced');
      const a = await stats(page);
      await page.waitForTimeout(400);
      expect((await stats(page)).hash).toBe(a.hash);

      await open(page, renderer, 1, 'full');
      const b = await stats(page);
      await page.waitForTimeout(400);
      expect((await stats(page)).hash).not.toBe(b.hash);
    });
  });
}
