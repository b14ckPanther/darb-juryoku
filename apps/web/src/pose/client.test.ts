import { describe, expect, it, vi } from 'vitest';
import { poseConfig } from '../config/posture';
import { createPoseClient } from './client';
import type { FromWorker, ToWorker } from './protocol';

function fakeWorker(reply: (m: ToWorker) => FromWorker | null) {
  const listeners: ((e: MessageEvent<FromWorker>) => void)[] = [];
  const posted: ToWorker[] = [];
  const transfers: unknown[] = [];
  return {
    posted,
    transfers,
    terminate: vi.fn(),
    addEventListener: (_: 'message', fn: (e: MessageEvent<FromWorker>) => void) =>
      listeners.push(fn),
    postMessage(m: ToWorker, transfer?: Transferable[]) {
      posted.push(m);
      transfers.push(transfer);
      const r = reply(m);
      if (r)
        queueMicrotask(() =>
          listeners.forEach((fn) => fn({ data: r } as MessageEvent<FromWorker>)),
        );
    },
  };
}

describe('pose client', () => {
  it('initialises the worker with the config and the app origin, and resolves ready', async () => {
    const w = fakeWorker((m) => (m.type === 'init' ? { type: 'ready', delegate: 'GPU' } : null));
    const client = createPoseClient(poseConfig, 'http://127.0.0.1:4173', () => w);
    await expect(client.ready).resolves.toBe('GPU');
    expect(w.posted[0]).toEqual({
      type: 'init',
      config: poseConfig,
      origin: 'http://127.0.0.1:4173',
    });
  });

  it('rejects ready with the worker’s error', async () => {
    const w = fakeWorker((m) =>
      m.type === 'init' ? { type: 'error', message: 'GPU: x; CPU: y' } : null,
    );
    await expect(createPoseClient(poseConfig, 'http://x', () => w).ready).rejects.toThrow(
      'GPU: x; CPU: y',
    );
  });

  it('transfers each frame and matches results to requests', async () => {
    const w = fakeWorker((m) =>
      m.type === 'init'
        ? { type: 'ready', delegate: 'CPU' }
        : m.type === 'frame'
          ? { type: 'result', id: m.id, t: m.t, landmarks: [[m.t, 0, 0, 1]], ms: 3 }
          : null,
    );
    const client = createPoseClient(poseConfig, 'http://x', () => w);
    await client.ready;
    const frame = {} as ImageBitmap;
    const [a, b] = await Promise.all([client.detect(frame, 1), client.detect(frame, 2)]);
    expect(a?.landmarks).toEqual([[1, 0, 0, 1]]);
    expect(b?.landmarks).toEqual([[2, 0, 0, 1]]);
    expect(w.transfers[1]).toEqual([frame]);
  });

  it('answers outstanding frames with nothing when closed', async () => {
    const w = fakeWorker((m) => (m.type === 'init' ? { type: 'ready', delegate: 'CPU' } : null));
    const client = createPoseClient(poseConfig, 'http://x', () => w);
    const pending = client.detect({} as ImageBitmap, 1);
    client.close();
    await expect(pending).resolves.toEqual({ landmarks: null, ms: 0 });
    expect(w.terminate).toHaveBeenCalled();
  });
});
