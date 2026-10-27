import { describe, expect, it } from 'vitest';
import type { Playback } from '../data/types';
import { matchAt, stateFor } from './playback';

const p: Playback = {
  seconds_per_key: 2,
  match: [1, 0, 0.5],
  state_from: { upright: 0.75, drifting: 0.45 },
  drift_class: 'slouch',
  nudge_after_seconds: 1,
  quiet_after_nudge_seconds: 1,
};

describe('matchAt', () => {
  it('hits each key on its beat', () => {
    expect(matchAt(p, 0)).toBe(1);
    expect(matchAt(p, 2)).toBe(0);
    expect(matchAt(p, 4)).toBe(0.5);
  });
  it('eases halfway between keys and loops back to the first', () => {
    expect(matchAt(p, 1)).toBeCloseTo(0.5);
    expect(matchAt(p, 5)).toBeCloseTo(0.75);
    expect(matchAt(p, 6)).toBe(1);
  });
});

describe('stateFor', () => {
  it('reads upright from the threshold up', () => {
    expect(stateFor(p, 0.75)).toBe('upright');
    expect(stateFor(p, 0.7)).toBe('drift');
  });
});
