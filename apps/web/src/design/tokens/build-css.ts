import { resolveScope, type DesignTokens, type ResolvedColour } from './load-tokens';

const kebab = (name: string) => name.replaceAll('_', '-');
const ROOT_FONT_PX = 16;

function cssColour({ hex, alpha }: ResolvedColour): string {
  if (alpha === 1) return hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

function roleLines(roles: Record<string, ResolvedColour>, indent: string): string[] {
  return Object.entries(roles).map(
    ([role, colour]) => `${indent}--${kebab(role)}: ${cssColour(colour)};`,
  );
}

function themeBlock(
  selector: string,
  scheme: string,
  roles: Record<string, ResolvedColour>,
  indent = '',
): string[] {
  return [
    `${indent}${selector} {`,
    `${indent}  color-scheme: ${scheme};`,
    ...roleLines(roles, `${indent}  `),
    `${indent}}`,
  ];
}

function staticTheme(tokens: DesignTokens): string[] {
  const { type, space, radius, elevation, layers, touch, material, motion, glow } = tokens;
  const lines = [
    `--font-display: ${type.families.display};`,
    `--font-ui: ${type.families.ui};`,
    ...Object.entries(type.weights).map(
      ([name, value]) => `--font-weight-${kebab(name)}: ${value};`,
    ),
    `--spacing: ${space.base_px / ROOT_FONT_PX}rem;`,
    `--space-gutter: ${space.gutter_px}px;`,
    `--space-section: ${space.section_px}px;`,
  ];
  for (const [name, step] of Object.entries(type.scale)) {
    const n = kebab(name);
    lines.push(
      `--text-${n}: ${step.size}rem;`,
      `--text-${n}--line-height: ${step.line};`,
      `--text-${n}--letter-spacing: ${step.tracking}em;`,
    );
  }
  for (const [name, value] of Object.entries(radius))
    lines.push(`--radius-${kebab(name)}: ${value};`);
  for (const [name, value] of Object.entries(elevation)) {
    lines.push(
      `--shadow-${kebab(name)}: ${value.replaceAll(/\{([a-z_]+)\}/g, (_m, role: string) => `var(--${kebab(role)})`)};`,
    );
  }
  for (const [name, value] of Object.entries(layers)) lines.push(`--z-${kebab(name)}: ${value};`);
  lines.push(
    `--touch-min: ${touch.min_target_px}px;`,
    `--press-scale: ${touch.press_scale};`,
    `--material-blur: ${material.blur_px}px;`,
    `--material-saturate: ${material.saturate};`,
  );
  for (const [name, ms] of Object.entries(motion.durations_ms))
    lines.push(`--duration-${kebab(name)}: ${ms}ms;`);
  for (const [name, value] of Object.entries(motion.easings))
    lines.push(`--ease-${kebab(name)}: ${value};`);
  lines.push(
    `--glow-outline-width: ${glow.outline_width_px}px;`,
    `--glow-outline-opacity: ${glow.outline_opacity};`,
    `--glow-rim-width: ${glow.rim_width_px}px;`,
    `--glow-rim-blur: ${glow.rim_blur_px}px;`,
  );
  return lines.map((l) => `  ${l}`);
}

/** Builds apps/web/src/design/tokens.css from the parsed tokens. Pure: same tokens, same text. */
export function buildTokensCss(tokens: DesignTokens): string {
  const dark = resolveScope(tokens, 'theme:dark');
  const light = resolveScope(tokens, 'theme:light');
  const out: string[] = [
    '/* Generated from config/design/tokens.yaml by `pnpm --filter web tokens`. Do not edit by hand. */',
    '',
    ...themeBlock(':root', 'dark', dark),
    '',
    '@media (prefers-color-scheme: light) {',
    ...themeBlock(':root:not([data-theme="dark"])', 'light', light, '  '),
    '}',
    '',
    ...themeBlock('[data-theme="dark"]', 'dark', dark),
    '',
    ...themeBlock('[data-theme="light"]', 'light', light),
  ];
  for (const [name, direction] of Object.entries(tokens.directions)) {
    out.push(
      '',
      ...themeBlock(
        `[data-direction="${name}"]`,
        direction.theme,
        resolveScope(tokens, `direction:${name}`),
      ),
    );
  }
  out.push('', '@theme static {', ...staticTheme(tokens), '}', '', '@theme inline {');
  for (const role of Object.keys(dark))
    out.push(`  --color-${kebab(role)}: var(--${kebab(role)});`);
  out.push('}', '');
  return out.join('\n');
}
