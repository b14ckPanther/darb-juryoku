import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tokens } from '../../test/design-fixtures';
import { buildTokensCss } from './build-css';

// Read from disk: Vitest serves `?raw` CSS imports as an empty string.
const committedCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../tokens.css'),
  'utf8',
);
const css = buildTokensCss(tokens);

const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `missing block ${selector}`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
};

describe('buildTokensCss', () => {
  it('starts with a generated-file notice', () => {
    expect(css.startsWith('/* Generated from config/design/tokens.yaml')).toBe(true);
  });

  it('makes night the default theme with resolved hex values', () => {
    const root = block(':root');
    expect(root).toContain('--surface: #03110C;');
    expect(root).toContain('--accent: #D9A54C;');
    expect(root).toContain('color-scheme: dark;');
  });

  it('turns an opacity suffix into rgb with alpha', () => {
    expect(block(':root')).toContain('--rule: rgb(251 247 236 / 0.12);');
  });

  it('switches to ivory for a light preference unless dark is forced', () => {
    expect(css).toContain('@media (prefers-color-scheme: light)');
    expect(block(':root:not([data-theme="dark"])')).toContain('--surface: #FBF7EC;');
    expect(block('[data-theme="light"]')).toContain('--text: #0B2219;');
  });

  it('emits each direction as a scoped override on top of its theme', () => {
    const ledger = block('[data-direction="ledger"]');
    expect(ledger).toContain('--surface: #FBF7EC;');
    expect(ledger).toContain('--drift: #8C8778;');
    expect(block('[data-direction="monitor"]')).toContain('--surface-raised: #03110C;');
  });

  it('emits the type scale, radii, motion and glow tokens as static Tailwind theme values', () => {
    const theme = block('@theme static');
    expect(theme).toContain("--font-display: 'Zen Old Mincho', 'Hiragino Mincho ProN', serif;");
    expect(theme).toContain('--spacing: 0.25rem;');
    expect(theme).toContain('--text-body: 1.0625rem;');
    expect(theme).toContain('--text-body--line-height: 1.5;');
    expect(theme).toContain('--text-hero--letter-spacing: -0.03em;');
    expect(theme).toContain('--radius-control: 999px;');
    expect(theme).toContain('--duration-fast: 120ms;');
    expect(theme).toContain('--ease-out: cubic-bezier(0.22, 1, 0.36, 1);');
    expect(theme).toContain('--press-scale: 0.97;');
    expect(theme).toContain('--glow-outline-width: 2px;');
    expect(theme).toContain('--z-sheet: 40;');
    expect(theme).toContain('--touch-min: 44px;');
  });

  it('builds elevation from the per-theme shadow tint', () => {
    expect(block('@theme static')).toContain(
      '--shadow-raised: 0 1px 2px var(--shadow-tint), 0 8px 24px -14px var(--shadow-tint);',
    );
  });

  it('maps semantic tokens into the Tailwind theme', () => {
    const theme = block('@theme inline');
    expect(theme).toContain('--color-surface: var(--surface);');
    expect(theme).toContain('--color-accent-fill: var(--accent-fill);');
  });

  it('matches the committed tokens.css, so the file is never edited by hand', () => {
    expect(committedCss).toBe(css);
  });
});
