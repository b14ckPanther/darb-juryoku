// MediaPipe Tasks Vision PoseLandmarker, loaded from the app origin only (config/pose.yaml).
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { LandmarkerFactory } from './protocol';

export const mediapipeFactory: LandmarkerFactory = async (config, origin, delegate) => {
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
