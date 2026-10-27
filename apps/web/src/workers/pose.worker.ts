/// <reference lib="webworker" />
// The pose worker: MediaPipe PoseLandmarker in VIDEO mode, loaded from the app origin only.
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { createPoseEngine } from '../pose/engine';
import type { LandmarkerFactory, ToWorker } from '../pose/protocol';

const factory: LandmarkerFactory = async (config, origin, delegate) => {
  const fileset = await FilesetResolver.forVisionTasks(new URL(config.wasm_base, origin).href);
  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: new URL(config.model_path, origin).href, delegate },
    runningMode: 'VIDEO',
    numPoses: config.num_poses,
    minPoseDetectionConfidence: config.min_pose_detection_confidence,
    minPosePresenceConfidence: config.min_pose_presence_confidence,
    minTrackingConfidence: config.min_tracking_confidence,
    outputSegmentationMasks: false,
  });
};

const scope = self as unknown as DedicatedWorkerGlobalScope;
const engine = createPoseEngine(factory, (m) => scope.postMessage(m));
scope.onmessage = (e: MessageEvent<ToWorker>) => void engine.handle(e.data);
