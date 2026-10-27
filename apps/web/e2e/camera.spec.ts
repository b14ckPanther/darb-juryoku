import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// Real mode on Chromium's fake camera (a synthetic test pattern with nobody in it). This runs the
// whole chain: permission, camera, the self-hosted MediaPipe worker, and the privacy rules.
const copy = parse(
  readFileSync(new URL('../../../config/copy/en.yaml', import.meta.url), 'utf8'),
) as {
  welcome: { allow: string };
  calibrate: { title: string; need_person: string; ready: string };
};
const pose = parse(readFileSync(new URL('../../../config/pose.yaml', import.meta.url), 'utf8')) as {
  model_path: string;
};

test('allow camera, load the pose model from the app, and find nobody in the test pattern', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? '').origin;
  const off: string[] = [];
  const posts: string[] = [];
  const served: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) off.push(r.url());
    if (r.method() !== 'GET') posts.push(`${r.method()} ${r.url()}`);
    if (url.pathname.startsWith('/vendor/')) served.push(url.pathname);
  });

  await page.goto('/?demo=0');
  await page.getByRole('button', { name: copy.welcome.allow }).click();
  await expect(page.getByRole('heading', { level: 1, name: copy.calibrate.title })).toBeVisible();
  const mirror = page.locator('[data-camera]').first();
  await expect(mirror).toHaveAttribute('data-camera', 'live');
  await expect(mirror).toHaveAttribute('data-pose', 'ready', { timeout: 30_000 });
  await expect(page.getByText(copy.calibrate.need_person)).toBeVisible();
  await expect(page.getByRole('button', { name: copy.calibrate.ready })).toBeDisabled();

  // Keep the camera running a while: nothing may leave the origin and nothing may be sent at all.
  await page.waitForTimeout(5_000);
  expect(served).toContain(pose.model_path);
  expect(off).toEqual([]);
  expect(posts).toEqual([]);
});
