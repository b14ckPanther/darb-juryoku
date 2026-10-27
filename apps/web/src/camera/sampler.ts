// Takes one frame every 1/sample_hz seconds from a playing video, as an ImageBitmap, and hands it
// on. One frame in flight at a time: a slow detector lowers the rate instead of queueing frames.
// Uses requestVideoFrameCallback where available (ARCHITECTURE section 5), a timer otherwise.

type Video = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number) => void) => number;
  cancelVideoFrameCallback?: (h: number) => void;
};

export interface SamplerDeps {
  grab: (video: HTMLVideoElement) => Promise<ImageBitmap>;
  now: () => number;
  setTimer: (fn: () => void, ms: number) => number;
  clearTimer: (h: number) => void;
}

const browserDeps = (): SamplerDeps => ({
  grab: (v) => createImageBitmap(v),
  now: () => Date.now(),
  setTimer: (fn, ms) => window.setTimeout(fn, ms),
  clearTimer: (h) => window.clearTimeout(h),
});

export function startSampler(
  video: Video,
  hz: number,
  onFrame: (frame: ImageBitmap, t: number) => Promise<void>,
  deps: SamplerDeps = browserDeps(),
): () => void {
  const interval = 1000 / hz;
  let stopped = false;
  let busy = false;
  let last = -Infinity;
  let handle = 0;
  let rvfc = 0;

  const schedule = () => {
    if (stopped) return;
    if (video.requestVideoFrameCallback) rvfc = video.requestVideoFrameCallback(() => void tick());
    else handle = deps.setTimer(() => void tick(), interval);
  };

  async function tick() {
    if (stopped) return;
    const t = deps.now();
    if (!busy && t - last >= interval && video.readyState >= 2) {
      busy = true;
      last = t;
      try {
        await onFrame(await deps.grab(video), t);
      } catch {
        // A frame that cannot be read is skipped; the next one is tried on schedule.
      } finally {
        busy = false;
      }
    }
    schedule();
  }

  schedule();
  return () => {
    stopped = true;
    deps.clearTimer(handle);
    if (rvfc) video.cancelVideoFrameCallback?.(rvfc);
  };
}
