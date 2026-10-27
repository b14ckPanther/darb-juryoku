import type { PoseConfig } from '../config/posture';
import type { FromWorker, ToWorker } from './protocol';

export interface PoseClient {
  /** Resolves with the delegate in use, or rejects if no delegate could load. */
  ready: Promise<'GPU' | 'CPU'>;
  detect(frame: ImageBitmap, t: number): Promise<{ landmarks: number[][] | null; ms: number }>;
  close(): void;
}

interface WorkerLike {
  postMessage(m: ToWorker, transfer?: Transferable[]): void;
  addEventListener(type: 'message', fn: (e: MessageEvent<FromWorker>) => void): void;
  terminate(): void;
}

/**
 * The pose worker as promises. Frames are transferred, so the caller must not use them again.
 * `mainThreadWorker` below stands in when a worker cannot load MediaPipe.
 */
export function createPoseClient(
  config: PoseConfig,
  origin: string,
  makeWorker: () => WorkerLike = () =>
    new Worker(new URL('../workers/pose.worker.ts', import.meta.url)),
): PoseClient {
  const worker = makeWorker();
  let id = 0;
  const pending = new Map<number, (r: { landmarks: number[][] | null; ms: number }) => void>();
  let settle: { ok: (d: 'GPU' | 'CPU') => void; fail: (e: Error) => void } | null = null;
  const ready = new Promise<'GPU' | 'CPU'>((ok, fail) => (settle = { ok, fail }));

  worker.addEventListener('message', (e) => {
    const m = e.data;
    if (m.type === 'ready') settle?.ok(m.delegate);
    else if (m.type === 'error') settle?.fail(new Error(m.message));
    else {
      pending.get(m.id)?.({ landmarks: m.landmarks, ms: m.ms });
      pending.delete(m.id);
    }
  });
  worker.postMessage({ type: 'init', config, origin });

  return {
    ready,
    detect(frame, t) {
      id += 1;
      const current = id;
      return new Promise((resolve) => {
        pending.set(current, resolve);
        worker.postMessage({ type: 'frame', id: current, t, frame }, [frame]);
      });
    },
    close() {
      worker.postMessage({ type: 'close' });
      worker.terminate();
      pending.forEach((r) => r({ landmarks: null, ms: 0 }));
      pending.clear();
    },
  };
}

/**
 * The same protocol on the main thread (ARCHITECTURE section 3's fallback): used when the worker
 * cannot start MediaPipe, for example in the dev server, which serves workers as modules.
 */
export function mainThreadWorker(): WorkerLike {
  const listeners: ((e: MessageEvent<FromWorker>) => void)[] = [];
  const emit = (m: FromWorker) =>
    listeners.forEach((fn) => fn({ data: m } as MessageEvent<FromWorker>));
  const engine = Promise.all([import('./engine'), import('./mediapipe')]).then(([e, mp]) =>
    e.createPoseEngine(mp.mediapipeFactory, emit),
  );
  return {
    postMessage: (m) => void engine.then((e) => e.handle(m)),
    addEventListener: (_type, fn) => listeners.push(fn),
    terminate: () => undefined,
  };
}

/** A worker client that falls back to the main thread if the worker cannot load the model. */
export function createPoseClientWithFallback(config: PoseConfig, origin: string): PoseClient {
  let current = createPoseClient(config, origin);
  const ready = current.ready.catch(() => {
    current.close();
    current = createPoseClient(config, origin, mainThreadWorker);
    return current.ready;
  });
  return {
    ready,
    detect: (frame, t) => current.detect(frame, t),
    close: () => current.close(),
  };
}
