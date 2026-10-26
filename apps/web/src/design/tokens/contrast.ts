import { resolveScope, scopes, type DesignTokens } from './load-tokens';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two opaque hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastCheck {
  scope: string;
  label: string;
  ratio: number;
  min: number;
  opaque: boolean;
}

/** Every foreground/background pair the tokens declare, checked in every theme and direction. */
export function contrastChecks(tokens: DesignTokens): ContrastCheck[] {
  const checks: ContrastCheck[] = [];
  for (const scope of scopes(tokens)) {
    const roles = resolveScope(tokens, scope);
    for (const [group, spec] of Object.entries(tokens.contrast)) {
      const pairs: [string, string][] = [...(spec.pairs ?? [])];
      for (const fg of spec.foregrounds ?? [])
        for (const bg of spec.backgrounds ?? []) pairs.push([fg, bg]);
      for (const [fg, bg] of pairs) {
        const f = roles[fg];
        const b = roles[bg];
        if (!f || !b) throw new Error(`${group}: role "${f ? bg : fg}" is not defined in ${scope}`);
        checks.push({
          scope,
          label: `${scope} ${group}: ${fg} on ${bg}`,
          ratio: contrastRatio(f.hex, b.hex),
          min: spec.min,
          opaque: f.alpha === 1 && b.alpha === 1,
        });
      }
    }
  }
  return checks;
}

function toOklab(hex: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Perceptual distance between two colours: Euclidean OKLab distance x100. */
export function oklabDelta(a: string, b: string): number {
  const [x, y] = [toOklab(a), toOklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100;
}

export interface SeparationCheck {
  scope: string;
  label: string;
  delta: number;
  min: number;
}

/** Mark colours that appear side by side (good and drift minutes) must differ perceptually, not only in lightness. */
export function separationChecks(tokens: DesignTokens): SeparationCheck[] {
  const { min_oklab_delta: min, pairs } = tokens.distinguishable;
  return scopes(tokens).flatMap((scope) => {
    const roles = resolveScope(tokens, scope);
    return pairs.map(([a, b]) => ({
      scope,
      label: `${scope}: ${a} against ${b}`,
      delta: oklabDelta(roles[a]?.hex ?? '', roles[b]?.hex ?? ''),
      min,
    }));
  });
}
