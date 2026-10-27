import { describe, expect, it } from 'vitest';
import type { SessionConfig } from '../config/posture';
import type { Probabilities } from './heuristic';
import { SessionEngine } from './session';

const cfg: SessionConfig = {
  ema_alpha: 0.5,
  enter_drift_below: 0.45,
  enter_drift_seconds: 3,
  exit_drift_above: 0.6,
  exit_drift_seconds: 2,
  absent_visibility_below: 0.5,
  absent_after_seconds: 3,
  max_gap_seconds: 2,
};

const UP: Probabilities = { upright: 0.9, slouch: 0.04, forward_head: 0.04, lean_side: 0.02 };
const FWD: Probabilities = { upright: 0.1, slouch: 0.1, forward_head: 0.75, lean_side: 0.05 };
// Fixed local clock: day '2026-10-27', minute from 09:00 plus elapsed seconds.
const T0 = 9 * 3600 * 1000;
const toLocal = (ms: number) => ({ day: '2026-10-27', minute: Math.floor(ms / 60000) });

/** Feeds `seconds` of one sample per second from `from` (seconds since T0). */
function feed(
  e: SessionEngine,
  from: number,
  seconds: number,
  probs: Probabilities | null,
  vis = 0.9,
) {
  let last = e.state;
  for (let s = from; s < from + seconds; s += 1)
    last = e.push({ t: T0 + s * 1000, probs, visibility: vis }).state;
  return last;
}

describe('SessionEngine', () => {
  it('starts upright and stays there on good samples', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    expect(feed(e, 0, 10, UP)).toBe('upright');
  });

  it('enters drift only after the dwell time, not on one bad sample', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    feed(e, 0, 5, UP);
    expect(feed(e, 5, 2, FWD)).toBe('upright');
    expect(feed(e, 7, 4, FWD)).toBe('forward_head');
  });

  it('ignores a short spike that recovers before the dwell time', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    feed(e, 0, 5, UP);
    feed(e, 5, 2, FWD);
    expect(feed(e, 7, 6, UP)).toBe('upright');
  });

  it('leaves drift only after the exit dwell, with hysteresis', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    feed(e, 0, 3, UP);
    feed(e, 3, 10, FWD);
    expect(e.state).toBe('forward_head');
    expect(feed(e, 13, 2, UP)).toBe('forward_head');
    expect(feed(e, 15, 4, UP)).toBe('upright');
  });

  it('reports absent after the configured seconds without a person', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    feed(e, 0, 3, UP);
    expect(feed(e, 3, 2, null)).toBe('upright');
    expect(feed(e, 5, 3, null)).toBe('absent');
    expect(feed(e, 8, 4, UP, 0.95)).toBe('upright');
  });

  it('treats low visibility as nobody in frame', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    expect(feed(e, 0, 6, UP, 0.2)).toBe('absent');
  });

  it('smooths probabilities with the configured EMA', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    e.push({ t: T0, probs: UP, visibility: 1 });
    const u = e.push({ t: T0 + 1000, probs: FWD, visibility: 1 });
    expect(u.smoothed?.upright).toBeCloseTo(0.5 * 0.1 + 0.5 * 0.9);
  });

  it('writes minute buckets with seconds per state, and a long gap as unwatched', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    const done = [];
    // A minute is written once time moves into the next one.
    for (let s = 0; s <= 61; s += 1)
      done.push(...e.push({ t: T0 + s * 1000, probs: UP, visibility: 1 }).minutes);
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({
      sessionId: 's1',
      day: '2026-10-27',
      minute: 540,
      good_s: 60,
      dominant: 'upright',
    });
    const gap = e.push({ t: T0 + 70_000, probs: UP, visibility: 1 });
    expect(gap.minutes).toEqual([]);
    const tail = e.finish(T0 + 120_000);
    // 60 to 61 s upright, then the 9 s gap and the 50 s to the end are both unwatched.
    expect(tail[0]).toMatchObject({ minute: 541, good_s: 1, unknown_s: 59, dominant: 'unknown' });
  });

  it('names the drift class that held a minute', () => {
    const e = new SessionEngine(cfg, 's1', toLocal);
    feed(e, 0, 2, UP);
    feed(e, 2, 58, FWD);
    const [m] = e.finish(T0 + 60_000);
    expect(m?.dominant).toBe('forward_head');
    expect(m?.drift_s ?? 0).toBeGreaterThan(m?.good_s ?? 0);
  });
});
