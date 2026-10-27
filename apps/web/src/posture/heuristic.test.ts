import { describe, expect, it } from 'vitest';
import { heuristicConfig, type HeuristicConfig } from '../config/posture';
import { classify, topClass } from './heuristic';

const cfg: HeuristicConfig = {
  temperature: 0.5,
  classes: {
    forward_head: [{ feature: 'head_drop_delta', op: 'lt', threshold: -0.1, scale: 0.1 }],
    slouch: [{ feature: 'shoulder_width_delta', op: 'gt', threshold: 0.1, scale: 0.1 }],
    lean_side: [{ feature: 'shoulder_roll_deg_delta', op: 'abs_gt', threshold: 5, scale: 5 }],
  },
};

const still = { head_drop_delta: 0, shoulder_width_delta: 0, shoulder_roll_deg_delta: 0 };

describe('heuristic classify', () => {
  it.each([
    ['sitting as calibrated', still, 'upright'],
    ['head dropped well past its threshold', { ...still, head_drop_delta: -0.4 }, 'forward_head'],
    ['leaning toward the screen', { ...still, shoulder_width_delta: 0.4 }, 'slouch'],
    ['shoulders tilted left', { ...still, shoulder_roll_deg_delta: 15 }, 'lean_side'],
    ['shoulders tilted right', { ...still, shoulder_roll_deg_delta: -15 }, 'lean_side'],
    ['a small drift under every threshold', { ...still, head_drop_delta: -0.05 }, 'upright'],
  ] as const)('%s reads %s', (_, features, expected) => {
    expect(topClass(classify(features, cfg))).toBe(expected);
  });

  it('gives probabilities that add up to 1', () => {
    const p = classify({ ...still, head_drop_delta: -0.2 }, cfg);
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('puts a class level with upright exactly at its threshold', () => {
    const p = classify({ ...still, head_drop_delta: -0.1 }, cfg);
    expect(p.forward_head).toBeCloseTo(p.upright);
  });

  it('uses the strongest of a class’s conditions', () => {
    const two: HeuristicConfig = {
      ...cfg,
      classes: {
        ...cfg.classes,
        forward_head: [
          { feature: 'head_drop_delta', op: 'lt', threshold: -0.1, scale: 0.1 },
          { feature: 'neck', op: 'abs_gt', threshold: 1, scale: 1 },
        ],
      },
    };
    expect(topClass(classify({ ...still, neck: -9 }, two))).toBe('forward_head');
  });

  it('treats a missing feature as no evidence', () => {
    expect(topClass(classify({}, cfg))).toBe('upright');
  });

  it('runs on the committed config', () => {
    expect(topClass(classify({ head_drop_delta: -0.5 }, heuristicConfig))).toBe('forward_head');
  });
});
