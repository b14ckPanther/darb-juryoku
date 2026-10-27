// One sample through the whole posture chain: landmarks -> features -> heuristic -> session engine,
// plus the contour the golden outline draws. Pure apart from the clock it is given.
import type { FeaturesConfig, HeuristicConfig, PoseConfig, SessionConfig } from '../config/posture';
import { poseFromLandmarks } from '../overlay/from-landmarks';
import type { Pose } from '../overlay/geometry';
import type { MinuteBucket } from '../report/types';
import {
  baseFeatures,
  featureNames,
  featureVector,
  type BaseFeatures,
  type Landmarks,
} from './features';
import { classify, type Probabilities } from './heuristic';
import { SessionEngine, type LiveState, localTime } from './session';

export interface PipelineConfig {
  features: FeaturesConfig;
  heuristic: HeuristicConfig;
  session: SessionConfig;
  pose: PoseConfig;
}

export interface Calibrated {
  landmarks: Landmarks;
  features: BaseFeatures;
  aspect: number;
}

export interface Step {
  state: LiveState;
  /** Smoothed upright probability, 0..1: the overlay's match strength. */
  match: number;
  probs: Probabilities | null;
  body: Pose | null;
  minutes: MinuteBucket[];
}

export class PosturePipeline {
  readonly ideal: Pose;
  private engine: SessionEngine;
  private names: string[];
  private lastMatch = 1;

  constructor(
    private cfg: PipelineConfig,
    private calibration: Calibrated,
    sessionId: string,
    toLocal = localTime,
  ) {
    this.engine = new SessionEngine(cfg.session, sessionId, toLocal);
    this.names = featureNames(cfg.features);
    this.ideal = poseFromLandmarks(calibration.landmarks, cfg.features.landmarks, cfg.pose.outline);
  }

  step(t: number, landmarks: Landmarks | null): Step {
    if (!landmarks) {
      const u = this.engine.push({ t, probs: null, visibility: 0 });
      return { state: u.state, match: this.lastMatch, probs: null, body: null, minutes: u.minutes };
    }
    const { features, aspect } = this.calibration;
    const vector = featureVector(landmarks, features, aspect, this.cfg.features);
    const named = Object.fromEntries(this.names.map((n, i) => [n, vector[i] ?? NaN]));
    const probs = classify(named, this.cfg.heuristic);
    const visibility = baseFeatures(landmarks, aspect, this.cfg.features)['visibility'] ?? 0;
    const u = this.engine.push({ t, probs, visibility });
    this.lastMatch = u.smoothed?.upright ?? this.lastMatch;
    return {
      state: u.state,
      match: this.lastMatch,
      probs,
      body: poseFromLandmarks(landmarks, this.cfg.features.landmarks, this.cfg.pose.outline),
      minutes: u.minutes,
    };
  }

  finish(t: number): MinuteBucket[] {
    return this.engine.finish(t);
  }
}
