import { describe, expect, it } from 'vitest';
import { featuresConfig, poseConfig } from '../config/posture';
import { poseFixture } from '../demo/pose';
import { poseFromLandmarks } from './from-landmarks';

/** Landmarks that, mirrored, put ears and shoulders where the Phase 2 fixture has them. */
function fromFixture() {
  const lm = Array.from({ length: 33 }, () => [0, 0, 0, 1]);
  const idx = featuresConfig.landmarks;
  const put = (name: string, p: [number, number]) => (lm[idx[name] ?? 0] = [1 - p[0], p[1], 0, 1]);
  const f = poseFixture.ideal;
  put('left_shoulder', f['l_shoulder'] ?? [0, 0]);
  put('right_shoulder', f['r_shoulder'] ?? [0, 0]);
  put('left_ear', f['l_ear'] ?? [0, 0]);
  put('right_ear', f['r_ear'] ?? [0, 0]);
  return lm;
}

describe('poseFromLandmarks', () => {
  const pose = poseFromLandmarks(fromFixture(), featuresConfig.landmarks, poseConfig.outline);

  it('has every point of the outline, in the fixture order', () => {
    expect(Object.keys(pose)).toEqual(poseFixture.points);
  });

  it('reproduces the synthetic figure from its own ears and shoulders, within 2% of the frame', () => {
    for (const name of poseFixture.points) {
      const [ax, ay] = poseFixture.ideal[name] ?? [0, 0];
      const [bx, by] = pose[name] ?? [9, 9];
      expect(Math.hypot(ax - bx, ay - by), name).toBeLessThan(0.02);
    }
  });

  it('mirrors the image like a mirror', () => {
    expect(pose['l_shoulder']?.[0]).toBeLessThan(pose['r_shoulder']?.[0] ?? 0);
  });
});
