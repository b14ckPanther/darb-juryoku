// Posture pipeline config: features, heuristic, session engine and pose detection, each validated
// against its schema at load.
import rawFeatures from '../../../../config/features.yaml?raw';
import rawHeuristic from '../../../../config/heuristic.yaml?raw';
import rawPose from '../../../../config/pose.yaml?raw';
import rawSession from '../../../../config/session.yaml?raw';
import featuresSchema from '../../../../packages/schemas/config/features.schema.json';
import heuristicSchema from '../../../../packages/schemas/config/heuristic.schema.json';
import poseSchema from '../../../../packages/schemas/config/pose.schema.json';
import sessionSchema from '../../../../packages/schemas/config/session.schema.json';
import { makeConfigParser } from './parse-config';

export type FeatureName =
  | 'head_forward'
  | 'neck_tilt_deg'
  | 'shoulder_roll_deg'
  | 'shoulder_width'
  | 'head_drop'
  | 'shoulder_hunch'
  | 'visibility';

export interface FeaturesConfig {
  version: number;
  landmarks: Record<string, number>;
  used: string[];
  features: { name: FeatureName; delta: 'difference' | 'ratio' }[];
}

export interface Condition {
  feature: string;
  op: 'lt' | 'gt' | 'abs_gt';
  threshold: number;
  scale: number;
}

export interface HeuristicConfig {
  temperature: number;
  classes: { forward_head: Condition[]; slouch: Condition[]; lean_side: Condition[] };
}

export interface SessionConfig {
  ema_alpha: number;
  enter_drift_below: number;
  enter_drift_seconds: number;
  exit_drift_above: number;
  exit_drift_seconds: number;
  absent_visibility_below: number;
  absent_after_seconds: number;
  max_gap_seconds: number;
}

export interface PoseConfig {
  wasm_base: string;
  model_path: string;
  model_source: string;
  model_sha256: string;
  delegates: ('GPU' | 'CPU')[];
  num_poses: 1;
  min_pose_detection_confidence: number;
  min_pose_presence_confidence: number;
  min_tracking_confidence: number;
}

export const parseFeaturesConfig = makeConfigParser<FeaturesConfig>(featuresSchema, (c) =>
  [...c.used, 'left_shoulder', 'right_shoulder', 'left_ear', 'right_ear', 'nose']
    .filter((n) => c.landmarks[n] === undefined)
    .map((n) => `landmark "${n}" has no index`),
);

export const parseHeuristicConfig = makeConfigParser<HeuristicConfig>(heuristicSchema);

export const parseSessionConfig = makeConfigParser<SessionConfig>(sessionSchema, (c) =>
  c.exit_drift_above > c.enter_drift_below
    ? []
    : ['exit_drift_above must be above enter_drift_below, or states would flicker'],
);

export const parsePoseConfig = makeConfigParser<PoseConfig>(poseSchema);

export const rawFeaturesYaml = rawFeatures;
export const featuresConfig = parseFeaturesConfig(rawFeatures, 'config/features.yaml');
export const heuristicConfig = parseHeuristicConfig(rawHeuristic, 'config/heuristic.yaml');
export const sessionConfig = parseSessionConfig(rawSession, 'config/session.yaml');
export const poseConfig = parsePoseConfig(rawPose, 'config/pose.yaml');
