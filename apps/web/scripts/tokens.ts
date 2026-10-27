// Regenerates src/design/tokens.css from config/design/tokens.yaml and the approved brand palette.
// Run with `pnpm --filter web tokens`. build-css.test.ts fails if the committed file drifts.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildTokensCss } from '../src/design/tokens/build-css';
import { parseDesignTokens, type BrandTokens } from '../src/design/tokens/load-tokens';

const fromRoot = (path: string) => new URL(`../../../${path}`, import.meta.url);
const brand = JSON.parse(readFileSync(fromRoot('brand/src/tokens.json'), 'utf8')) as BrandTokens;
const tokens = parseDesignTokens(
  readFileSync(fromRoot('config/design/tokens.yaml'), 'utf8'),
  brand,
  'config/design/tokens.yaml',
);
const target = new URL('../src/design/tokens.css', import.meta.url);
writeFileSync(target, buildTokensCss(tokens));
console.log(`Wrote ${target.pathname}`);
