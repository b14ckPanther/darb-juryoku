// Messages between the app and the pose worker. Frames go in as transferred ImageBitmaps and are
// closed after detection; only landmarks come back. Nothing is stored or sent anywhere.
import type { PoseConfig } from '../config/posture';

export type ToWorker =
  | { type: 'init'; config: PoseConfig; origin: string }
  | { type: 'frame'; id: number; t: number; frame: ImageBitmap }
  | { type: 'close' };

export type FromWorker =
  | { type: 'ready'; delegate: 'GPU' | 'CPU' }
  | { type: 'error'; message: string }
  /** `landmarks` is null when no person was found; `ms` is the detection time. */
  | { type: 'result'; id: number; t: number; landmarks: number[][] | null; ms: number };

export interface Landmarker {
  detectForVideo(
    frame: ImageBitmap,
    t: number,
  ): { landmarks: { x: number; y: number; z: number; visibility?: number }[][] };
  close(): void;
}

export type LandmarkerFactory = (
  config: PoseConfig,
  origin: string,
  delegate: 'GPU' | 'CPU',
) => Promise<Landmarker>;
