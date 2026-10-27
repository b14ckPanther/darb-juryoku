// The heuristic baseline: thresholds from config/heuristic.yaml on the calibration deltas. Used
// before a model exists, when a model fails to load, and as the bar every model must beat.
import type { HeuristicConfig } from '../config/posture';
import type { PostureClass } from '../report/types';

export type Probabilities = Record<PostureClass, number>;

const DRIFT = ['forward_head', 'slouch', 'lean_side'] as const;

function score(
  features: Record<string, number>,
  cfg: HeuristicConfig['classes'][keyof HeuristicConfig['classes']],
) {
  let best = -Infinity;
  for (const c of cfg) {
    const v = features[c.feature];
    if (v === undefined || Number.isNaN(v)) continue;
    const margin =
      c.op === 'lt' ? c.threshold - v : c.op === 'gt' ? v - c.threshold : Math.abs(v) - c.threshold;
    best = Math.max(best, margin / c.scale);
  }
  return best;
}

/** Class probabilities: a softmax of each drift class's strongest margin, with upright at 0. */
export function classify(features: Record<string, number>, cfg: HeuristicConfig): Probabilities {
  const logits = DRIFT.map((c) => score(features, cfg.classes[c]) / cfg.temperature);
  const exps = [1, ...logits.map((l) => (l === -Infinity ? 0 : Math.exp(Math.min(l, 50))))];
  const total = exps.reduce((a, b) => a + b, 0);
  const [up = 1, fh = 0, sl = 0, ls = 0] = exps.map((e) => e / total);
  return { upright: up, forward_head: fh, slouch: sl, lean_side: ls };
}

export const topClass = (p: Probabilities): PostureClass =>
  (Object.entries(p) as [PostureClass, number][]).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
