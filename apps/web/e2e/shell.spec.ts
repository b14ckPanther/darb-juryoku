import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const appYaml = parse(
  readFileSync(new URL('../../../config/app.yaml', import.meta.url), 'utf8'),
) as {
  name: string;
};
const copyYaml = parse(
  readFileSync(new URL('../../../config/copy/en.yaml', import.meta.url), 'utf8'),
) as { welcome: { title: string } };

test('serves the shell cross-origin isolated with the configured name', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.headers()['cross-origin-opener-policy']).toBe('same-origin');
  expect(response?.headers()['cross-origin-embedder-policy']).toBe('require-corp');
  await expect(page.getByRole('heading', { level: 1, name: copyYaml.welcome.title })).toBeVisible();
  await expect(page.getByRole('link', { name: appYaml.name }).first()).toBeAttached();
  await expect(page).toHaveTitle(appYaml.name);
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
});

test('makes no request that leaves the origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? '').origin;
  const offOrigin: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) offOrigin.push(request.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(offOrigin).toEqual([]);
});
