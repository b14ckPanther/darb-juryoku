// Posture features from MediaPipe landmarks. The Python twin is ml/src/pg_ml/features.py; both
// follow config/features.yaml and are held together by the golden-file parity test.
import { parse } from 'yaml';
import type { FeaturesConfig } from '../config/posture';

/** 33 rows of [x, y, z, visibility]; x and y normalised 0..1 of the frame. */
export type Landmarks = number[][];
export type BaseFeatures = Record<string, number>;

const EPS = 1e-9;

/** Sorted keys, no spaces: the text Python's json.dumps(sort_keys=True, separators=(',', ':')) makes. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

/** SHA-256 of the parsed features file, the key a released model must match. */
export async function featuresHash(rawYaml: string): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(parse(rawYaml)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const featureNames = (cfg: FeaturesConfig) => {
  const base = cfg.features.map((f) => f.name);
  return [...base, ...base.map((n) => `${n}_delta`)];
};

/** Features of one frame. `aspect` (width over height) makes x and y the same unit. */
export function baseFeatures(lm: Landmarks, aspect: number, cfg: FeaturesConfig): BaseFeatures {
  const at = (name: string): [number, number] => {
    const row = lm[cfg.landmarks[name] ?? -1] ?? [0, 0, 0, 0];
    return [(row[0] ?? 0) * aspect, row[1] ?? 0];
  };
  const [lsx, lsy] = at('left_shoulder');
  const [rsx, rsy] = at('right_shoulder');
  const [lex, ley] = at('left_ear');
  const [rex, rey] = at('right_ear');
  const [, ny] = at('nose');
  const smx = (lsx + rsx) / 2;
  const smy = (lsy + rsy) / 2;
  const emx = (lex + rex) / 2;
  const emy = (ley + rey) / 2;
  const sw = Math.max(Math.hypot(lsx - rsx, lsy - rsy), EPS);
  const deg = (r: number) => (r * 180) / Math.PI;
  const vis = cfg.used.map((n) => lm[cfg.landmarks[n] ?? -1]?.[3] ?? 0);
  const values: Record<string, number> = {
    head_forward: (emx - smx) / sw,
    neck_tilt_deg: deg(Math.atan2(emx - smx, smy - emy)),
    shoulder_roll_deg: deg(Math.atan2(lsy - rsy, Math.abs(lsx - rsx))),
    shoulder_width: sw,
    head_drop: (smy - ny) / sw,
    shoulder_hunch: (smy - emy) / sw,
    visibility: vis.reduce((a, b) => a + b, 0) / vis.length,
  };
  return Object.fromEntries(cfg.features.map((f) => [f.name, values[f.name] ?? NaN]));
}

/** Base features then their deltas from the calibrated ideal, in features.yaml order. */
export function featureVector(
  lm: Landmarks,
  ideal: BaseFeatures,
  aspect: number,
  cfg: FeaturesConfig,
): number[] {
  const now = baseFeatures(lm, aspect, cfg);
  const value = (n: string) => now[n] ?? NaN;
  const deltas = cfg.features.map((f) =>
    f.delta === 'difference'
      ? value(f.name) - (ideal[f.name] ?? NaN)
      : value(f.name) / Math.max(ideal[f.name] ?? NaN, EPS) - 1,
  );
  return [...cfg.features.map((f) => value(f.name)), ...deltas];
}

/** The ideal pose: the median of each landmark coordinate over the hold (numpy's median). */
export function calibrate(frames: Landmarks[]): Landmarks {
  const first = frames[0];
  if (!first) throw new Error('A calibration needs at least one frame');
  return first.map((row, i) =>
    row.map((_, j) => {
      const xs = frames.map((f) => f[i]?.[j] ?? 0).sort((a, b) => a - b);
      const mid = Math.floor(xs.length / 2);
      return xs.length % 2 ? (xs[mid] ?? 0) : ((xs[mid - 1] ?? 0) + (xs[mid] ?? 0)) / 2;
    }),
  );
}
