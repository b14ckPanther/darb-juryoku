// The golden outline's contour from MediaPipe landmarks: the same eleven points as the synthetic
// fixture, mirrored so the screen behaves like a mirror. Proportions come from config/pose.yaml.
import type { FeaturesConfig, PoseConfig } from '../config/posture';
import type { Landmarks } from '../posture/features';
import type { Point, Pose } from './geometry';

export function poseFromLandmarks(
  lm: Landmarks,
  landmarks: FeaturesConfig['landmarks'],
  o: PoseConfig['outline'],
): Pose {
  // Mirror x: the person's left shoulder shows on the screen's left, as in a mirror.
  const at = (name: string): Point => {
    const row = lm[landmarks[name] ?? -1] ?? [0, 0];
    return [1 - (row[0] ?? 0), row[1] ?? 0];
  };
  const ls = at('left_shoulder');
  const rs = at('right_shoulder');
  const le = at('left_ear');
  const re = at('right_ear');
  const ear = Math.hypot(re[0] - le[0], re[1] - le[1]);
  const mid: Point = [(le[0] + re[0]) / 2, (le[1] + re[1]) / 2];
  const shoulderMid = (ls[0] + rs[0]) / 2;
  const inward = (p: Point, by: number): number => p[0] + Math.sign(mid[0] - p[0]) * by * ear;
  const neck = (e: Point, s: Point): Point => [
    inward([e[0] + (s[0] - e[0]) * o.neck_at, 0], o.neck_inset),
    e[1] + (s[1] - e[1]) * o.neck_at,
  ];
  const arm = (s: Point): Point => [s[0] + (s[0] - shoulderMid) * o.arm_spread, 1];
  return {
    l_arm: arm(ls),
    l_shoulder: ls,
    l_neck: neck(le, ls),
    l_ear: le,
    l_temple: [inward(le, o.temple_inset), le[1] - o.temple_up * ear],
    head_top: [mid[0], mid[1] - o.crown_up * ear],
    r_temple: [inward(re, o.temple_inset), re[1] - o.temple_up * ear],
    r_ear: re,
    r_neck: neck(re, rs),
    r_shoulder: rs,
    r_arm: arm(rs),
  };
}
