import { describe, expect, it, vi } from 'vitest';
import { startSampler, type SamplerDeps } from './sampler';

function harness() {
  let clock = 0;
  const timers: (() => void)[] = [];
  const deps: SamplerDeps = {
    grab: vi.fn(async () => ({}) as ImageBitmap),
    now: () => clock,
    setTimer: (fn) => timers.push(fn),
    clearTimer: vi.fn(),
  };
  const video = { readyState: 4 } as HTMLVideoElement;
  const advance = async (ms: number) => {
    clock += ms;
    const fn = timers.shift();
    fn?.();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { deps, video, advance };
}

describe('startSampler', () => {
  it('takes frames no faster than the sample rate', async () => {
    const h = harness();
    const onFrame = vi.fn(async () => undefined);
    startSampler(h.video, 5, onFrame, h.deps);
    for (let i = 0; i < 10; i += 1) await h.advance(100); // 1 s of 100 ms ticks
    expect(onFrame).toHaveBeenCalledTimes(5);
  });

  it('skips frames while the previous one is still being read', async () => {
    const h = harness();
    let release: () => void = () => undefined;
    const onFrame = vi.fn(() => new Promise<void>((r) => (release = r)));
    startSampler(h.video, 5, onFrame, h.deps);
    await h.advance(200);
    await h.advance(200);
    await h.advance(200);
    expect(onFrame).toHaveBeenCalledTimes(1);
    release();
    await h.advance(200);
    await h.advance(200);
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it('waits for a playable video and stops cleanly', async () => {
    const h = harness();
    const video = { readyState: 1 } as HTMLVideoElement;
    const onFrame = vi.fn(async () => undefined);
    const stop = startSampler(video, 5, onFrame, h.deps);
    await h.advance(300);
    expect(onFrame).not.toHaveBeenCalled();
    stop();
    expect(h.deps.clearTimer).toHaveBeenCalled();
  });
});
