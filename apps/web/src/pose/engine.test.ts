import { describe, expect, it, vi } from 'vitest';
import { poseConfig } from '../config/posture';
import { createPoseEngine } from './engine';
import type { FromWorker, Landmarker } from './protocol';

const bitmap = () =>
  ({ close: vi.fn() }) as unknown as ImageBitmap & { close: ReturnType<typeof vi.fn> };
const landmarker = (out: Landmarker['detectForVideo']): Landmarker => ({
  detectForVideo: out,
  close: vi.fn(),
});
const point = { x: 0.5, y: 0.4, z: -0.1, visibility: 0.9 };

describe('pose engine (worker protocol)', () => {
  it('falls back from GPU to CPU and says which one it uses', async () => {
    const posts: FromWorker[] = [];
    const factory = vi.fn(async (_c, _o, d: 'GPU' | 'CPU') => {
      if (d === 'GPU') throw new Error('no WebGL in worker');
      return landmarker(() => ({ landmarks: [] }));
    });
    await createPoseEngine(factory, (m) => posts.push(m)).handle({
      type: 'init',
      config: poseConfig,
      origin: 'http://x',
    });
    expect(factory).toHaveBeenCalledTimes(2);
    expect(posts).toEqual([{ type: 'ready', delegate: 'CPU' }]);
  });

  it('reports an error naming every delegate that failed', async () => {
    const posts: FromWorker[] = [];
    await createPoseEngine(
      async () => Promise.reject(new Error('missing model')),
      (m) => posts.push(m),
    ).handle({
      type: 'init',
      config: poseConfig,
      origin: 'http://x',
    });
    expect(posts[0]).toMatchObject({
      type: 'error',
      message: expect.stringMatching(/GPU: missing model; CPU: missing model/),
    });
  });

  it('returns landmarks as rows of x, y, z, visibility and closes the frame', async () => {
    const posts: FromWorker[] = [];
    let clock = 0;
    const engine = createPoseEngine(
      async () => landmarker(() => ({ landmarks: [[point, point]] })),
      (m) => posts.push(m),
      () => (clock += 4),
    );
    await engine.handle({ type: 'init', config: poseConfig, origin: 'http://x' });
    const frame = bitmap();
    await engine.handle({ type: 'frame', id: 7, t: 100, frame });
    expect(posts.at(-1)).toEqual({
      type: 'result',
      id: 7,
      t: 100,
      landmarks: [
        [0.5, 0.4, -0.1, 0.9],
        [0.5, 0.4, -0.1, 0.9],
      ],
      ms: 4,
    });
    expect(frame.close).toHaveBeenCalled();
  });

  it('answers null when nobody is in frame or detection throws, and still closes the frame', async () => {
    const posts: FromWorker[] = [];
    let call = 0;
    const engine = createPoseEngine(
      async () =>
        landmarker(() => {
          call += 1;
          if (call === 2) throw new Error('bad frame');
          return { landmarks: [] };
        }),
      (m) => posts.push(m),
    );
    await engine.handle({ type: 'init', config: poseConfig, origin: 'http://x' });
    const a = bitmap();
    const b = bitmap();
    await engine.handle({ type: 'frame', id: 1, t: 1, frame: a });
    await engine.handle({ type: 'frame', id: 2, t: 2, frame: b });
    expect(posts.slice(1).map((p) => (p.type === 'result' ? p.landmarks : 'x'))).toEqual([
      null,
      null,
    ]);
    expect(a.close).toHaveBeenCalled();
    expect(b.close).toHaveBeenCalled();
  });

  it('closes frames that arrive before it is ready', async () => {
    const posts: FromWorker[] = [];
    const frame = bitmap();
    await createPoseEngine(
      async () => landmarker(() => ({ landmarks: [] })),
      (m) => posts.push(m),
    ).handle({ type: 'frame', id: 1, t: 1, frame });
    expect(frame.close).toHaveBeenCalled();
    expect(posts[0]).toMatchObject({ type: 'result', landmarks: null });
  });
});
