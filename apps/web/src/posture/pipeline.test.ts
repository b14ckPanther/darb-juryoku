import { describe, expect, it } from 'vitest';
import { featuresConfig, heuristicConfig, poseConfig, sessionConfig } from '../config/posture';
import { baseFeatures, type Landmarks } from './features';
import { PosturePipeline } from './pipeline';

const idx = featuresConfig.landmarks;
const ASPECT = 4 / 3;

/** A synthetic upper body (numbers, not a recording of anyone). `drop` lowers the head. */
function body(drop = 0, vis = 0.95): Landmarks {
  const lm = Array.from({ length: 33 }, () => [0, 0, 0, vis]);
  const set = (n: string, x: number, y: number) => (lm[idx[n] ?? 0] = [x, y, 0, vis]);
  set('left_shoulder', 0.65, 0.7);
  set('right_shoulder', 0.35, 0.7);
  set('left_ear', 0.55, 0.45 + drop);
  set('right_ear', 0.45, 0.45 + drop);
  set('nose', 0.5, 0.42 + drop);
  return lm;
}

const cfg = {
  features: featuresConfig,
  heuristic: heuristicConfig,
  session: sessionConfig,
  pose: poseConfig,
};
const ideal = body();
const calibration = {
  landmarks: ideal,
  features: baseFeatures(ideal, ASPECT, featuresConfig),
  aspect: ASPECT,
};
const toLocal = (ms: number) => ({ day: '2026-10-27', minute: Math.floor(ms / 60000) });

/** Runs a recorded-synthetic track at 5 samples a second and returns the state after each phase. */
function run(track: [seconds: number, lm: Landmarks | null][]) {
  const p = new PosturePipeline(cfg, calibration, 's', toLocal);
  let t = 9 * 3600 * 1000;
  return track.map(([seconds, lm]) => {
    let last = p.step(t, lm);
    for (let i = 0; i < seconds * 5; i += 1) last = p.step((t += 200), lm);
    return last;
  });
}

describe('PosturePipeline on a synthetic landmark track', () => {
  it('reads upright, then head forward after the dwell, then upright again', () => {
    const [still, dropped, back] = run([
      [5, body()],
      [8, body(0.12)],
      [8, body()],
    ]);
    expect(still?.state).toBe('upright');
    expect(still?.match).toBeGreaterThan(0.8);
    expect(dropped?.state).toBe('forward_head');
    expect(dropped?.match).toBeLessThan(0.3);
    expect(back?.state).toBe('upright');
  });

  it('reads away when nobody is in frame', () => {
    const [, gone] = run([
      [3, body()],
      [5, null],
    ]);
    expect(gone?.state).toBe('absent');
    expect(gone?.body).toBeNull();
  });

  it('draws the live body and the calibrated ideal as outline contours', () => {
    const p = new PosturePipeline(cfg, calibration, 's', toLocal);
    const step = p.step(0, body(0.1));
    expect(Object.keys(step.body ?? {})).toEqual(Object.keys(p.ideal));
    expect(step.body?.['head_top']?.[1]).toBeGreaterThan(p.ideal['head_top']?.[1] ?? 1);
  });
});
