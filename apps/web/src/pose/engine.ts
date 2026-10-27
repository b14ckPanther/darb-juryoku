import type { FromWorker, Landmarker, LandmarkerFactory, ToWorker } from './protocol';

/**
 * The pose worker's logic, separate from MediaPipe so it can be tested with a fake landmarker.
 * It tries the configured delegates in order (GPU, then CPU), answers one result per frame, and
 * always closes the frame.
 */
export function createPoseEngine(
  factory: LandmarkerFactory,
  post: (m: FromWorker) => void,
  now: () => number = () => performance.now(),
) {
  let landmarker: Landmarker | null = null;

  async function init(msg: Extract<ToWorker, { type: 'init' }>) {
    const errors: string[] = [];
    for (const delegate of msg.config.delegates) {
      try {
        landmarker = await factory(msg.config, msg.origin, delegate);
        post({ type: 'ready', delegate });
        return;
      } catch (e) {
        errors.push(`${delegate}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    post({ type: 'error', message: errors.join('; ') });
  }

  function frame(msg: Extract<ToWorker, { type: 'frame' }>) {
    const start = now();
    let landmarks: number[][] | null = null;
    try {
      if (landmarker) {
        const result = landmarker.detectForVideo(msg.frame, msg.t);
        const first = result.landmarks[0];
        landmarks = first ? first.map((p) => [p.x, p.y, p.z, p.visibility ?? 0]) : null;
      }
    } catch {
      landmarks = null;
    } finally {
      msg.frame.close();
    }
    post({ type: 'result', id: msg.id, t: msg.t, landmarks, ms: now() - start });
  }

  return {
    async handle(msg: ToWorker) {
      if (msg.type === 'init') await init(msg);
      else if (msg.type === 'frame') frame(msg);
      else {
        landmarker?.close();
        landmarker = null;
      }
    },
  };
}
