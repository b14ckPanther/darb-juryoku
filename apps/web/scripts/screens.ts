// Captures the Phase 3 screen set (docs/screens/phase-03) from a running preview server:
//   pnpm build && pnpm preview --port 4180, then SCREENS_URL=http://127.0.0.1:4180 pnpm screens
// Every capture is demo mode. Phone at 390 px, desktop at 1440 px, night and ivory themes.
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from '@playwright/test';

const base = process.env['SCREENS_URL'] ?? 'http://127.0.0.1:4180';
const out = new URL('../../../docs/screens/phase-03/', import.meta.url).pathname;
const only = process.env['SCREENS_ONLY'];
mkdirSync(out, { recursive: true });

const shots: [string, string, ((p: Page) => Promise<void>)?][] = [
  ['welcome', '/welcome'],
  ['calibrate', '/calibrate'],
  ['live', '/'],
  ['sentinel', '/sentinel'],
  ['nudges', '/nudges'],
  ['today', '/today'],
  ['history', '/history'],
  ['day', '/history/2026-10-23'],
  ['studio', '/studio'],
  ['lab', '/lab'],
  ['settings', '/settings'],
  ['today-empty', '/today?state=empty'],
  ['loading', '/today?state=loading'],
  ['error', '/today?state=error'],
  ['welcome-denied', '/welcome?state=denied'],
  ['live-away', '/?state=absent'],
];

const sizes = [
  { name: '390', viewport: { width: 390, height: 844 }, mobile: true },
  { name: 'desktop', viewport: { width: 1440, height: 960 }, mobile: false },
];

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const theme of ['dark', 'light'] as const) {
  for (const size of sizes) {
    const context = await browser.newContext({
      viewport: size.viewport,
      deviceScaleFactor: size.mobile ? 2 : 1,
      isMobile: size.mobile,
      hasTouch: size.mobile,
      colorScheme: theme,
      reducedMotion: 'reduce',
    });
    await context.addInitScript((t) => {
      localStorage.setItem('juryoku.theme', t);
      localStorage.setItem('juryoku.demo', '1');
    }, theme);
    const page = await context.newPage();
    for (const [name, path, act] of shots) {
      if (only && !name.startsWith(only)) continue;
      await page.goto(base + path);
      await page.waitForTimeout(1200);
      await act?.(page);
      await page.screenshot({ path: `${out}${name}-${size.name}-${theme}.png`, fullPage: true });
    }
    await context.close();
  }
}
await browser.close();
console.log(`Wrote screenshots to ${out}`);
