// The session engine: smoothed probabilities, hysteresis between posture states, nobody-in-frame
// detection, and per-minute buckets for the report. Pure: time comes in with each sample.
import type { SessionConfig } from '../config/posture';
import type { DriftClass, MinuteBucket, MinuteState } from '../report/types';
import type { Probabilities } from './heuristic';

export type LiveState = 'upright' | DriftClass | 'absent';

export interface Sample {
  /** Epoch milliseconds. */
  t: number;
  /** Null when no pose was found. */
  probs: Probabilities | null;
  visibility: number;
}

export interface Update {
  state: LiveState;
  smoothed: Probabilities | null;
  changed: boolean;
  /** Minutes completed by this sample, oldest first. */
  minutes: MinuteBucket[];
}

type LocalTime = (ms: number) => { day: string; minute: number };

export const localTime: LocalTime = (ms) => {
  const d = new Date(ms);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { day, minute: d.getHours() * 60 + d.getMinutes() };
};

const DRIFT: DriftClass[] = ['slouch', 'forward_head', 'lean_side'];
const topDrift = (p: Probabilities): DriftClass =>
  DRIFT.reduce((a, b) => (p[b] > p[a] ? b : a), DRIFT[0] as DriftClass);

interface Open {
  key: string;
  day: string;
  minute: number;
  seconds: Record<MinuteState, number>;
}

const emptySeconds = (): Record<MinuteState, number> => ({
  upright: 0,
  slouch: 0,
  forward_head: 0,
  lean_side: 0,
  absent: 0,
  unknown: 0,
});

export class SessionEngine {
  state: LiveState = 'upright';
  private ema: Probabilities | null = null;
  private lastT: number | null = null;
  private belowSince: number | null = null;
  private aboveSince: number | null = null;
  private absentSince: number | null = null;
  private open: Open | null = null;

  constructor(
    private cfg: SessionConfig,
    private sessionId: string,
    private toLocal: LocalTime = localTime,
  ) {}

  push(sample: Sample): Update {
    const before = this.state;
    const minutes = this.account(sample.t);
    this.lastT = sample.t;
    const c = this.cfg;
    const seen = sample.probs !== null && sample.visibility >= c.absent_visibility_below;

    if (!seen) {
      this.absentSince ??= sample.t;
      if (sample.t - this.absentSince >= c.absent_after_seconds * 1000) this.state = 'absent';
      return { state: this.state, smoothed: this.ema, changed: this.state !== before, minutes };
    }

    this.absentSince = null;
    const p = sample.probs as Probabilities;
    const a = c.ema_alpha;
    this.ema = this.ema
      ? {
          upright: a * p.upright + (1 - a) * this.ema.upright,
          slouch: a * p.slouch + (1 - a) * this.ema.slouch,
          forward_head: a * p.forward_head + (1 - a) * this.ema.forward_head,
          lean_side: a * p.lean_side + (1 - a) * this.ema.lean_side,
        }
      : { ...p };
    const up = this.ema.upright;

    if (this.state === 'absent') {
      // Back in frame: start from what the smoothed reading says now.
      this.state = up < c.enter_drift_below ? topDrift(this.ema) : 'upright';
      this.belowSince = this.aboveSince = null;
    } else if (this.state === 'upright') {
      if (up < c.enter_drift_below) {
        this.belowSince ??= sample.t;
        if (sample.t - this.belowSince >= c.enter_drift_seconds * 1000) {
          this.state = topDrift(this.ema);
          this.belowSince = null;
        }
      } else this.belowSince = null;
    } else {
      if (up > c.exit_drift_above) {
        this.aboveSince ??= sample.t;
        if (sample.t - this.aboveSince >= c.exit_drift_seconds * 1000) {
          this.state = 'upright';
          this.aboveSince = null;
        }
      } else {
        this.aboveSince = null;
        this.state = topDrift(this.ema);
      }
    }
    return { state: this.state, smoothed: this.ema, changed: this.state !== before, minutes };
  }

  /** Closes the session at `t` and returns the minutes not yet written. */
  finish(t: number): MinuteBucket[] {
    const minutes = this.account(t);
    this.lastT = t;
    if (this.open) minutes.push(this.close(this.open));
    this.open = null;
    return minutes;
  }

  /** Credits the time since the last sample to the state held during it, split at minute edges. */
  private account(t: number): MinuteBucket[] {
    const done: MinuteBucket[] = [];
    if (this.lastT === null || t <= this.lastT) return done;
    const gap = (t - this.lastT) / 1000 > this.cfg.max_gap_seconds;
    const as: MinuteState = gap ? 'unknown' : this.state;
    let from = this.lastT;
    while (from < t) {
      const edge = (Math.floor(from / 60000) + 1) * 60000;
      const to = Math.min(t, edge);
      const { day, minute } = this.toLocal(from);
      const key = `${day}:${minute}`;
      if (this.open && this.open.key !== key) {
        done.push(this.close(this.open));
        this.open = null;
      }
      this.open ??= { key, day, minute, seconds: emptySeconds() };
      this.open.seconds[as] += (to - from) / 1000;
      from = to;
    }
    return done;
  }

  private close(o: Open): MinuteBucket {
    const s = o.seconds;
    const r = (n: number) => Math.round(n * 1000) / 1000;
    const dominant = (Object.entries(s) as [MinuteState, number][]).reduce((a, b) =>
      b[1] > a[1] ? b : a,
    )[0];
    return {
      sessionId: this.sessionId,
      day: o.day,
      minute: o.minute,
      good_s: r(s.upright),
      drift_s: r(s.slouch + s.forward_head + s.lean_side),
      absent_s: r(s.absent),
      unknown_s: r(s.unknown),
      dominant,
    };
  }
}
