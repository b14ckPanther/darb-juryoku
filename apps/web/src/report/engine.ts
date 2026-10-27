// The report engine: pure functions from minute buckets to the numbers on Today and History.
// No DOM, no clock, no copy: wording comes from config/report.yaml through pickObservation.
import { isDrift, type MinuteBucket } from './types';

export interface DaySummary {
  date: string;
  good_s: number;
  drift_s: number;
  absent_s: number;
  unknown_s: number;
  /** Good time over sitting time (good + drift), or null when nobody sat. */
  share: number | null;
}

const shareOf = (good: number, drift: number) => (good + drift > 0 ? good / (good + drift) : null);

export function goodShare(buckets: MinuteBucket[]): number | null {
  let good = 0;
  let drift = 0;
  for (const b of buckets) {
    good += b.good_s;
    drift += b.drift_s;
  }
  return shareOf(good, drift);
}

const byTime = (a: MinuteBucket, b: MinuteBucket) =>
  a.day === b.day ? a.minute - b.minute : a.day < b.day ? -1 : 1;

/** The longest unbroken run of drift minutes. Away, unwatched, a gap or a new session breaks it. */
export function longestDrift(buckets: MinuteBucket[]): { minutes: number; start: number } | null {
  let best: { minutes: number; start: number } | null = null;
  let run = 0;
  let start = 0;
  let prev: MinuteBucket | null = null;
  for (const b of [...buckets].sort(byTime)) {
    const continues =
      prev !== null &&
      prev.day === b.day &&
      prev.sessionId === b.sessionId &&
      b.minute === prev.minute + 1;
    if (isDrift(b.dominant)) {
      if (run > 0 && continues) run += 1;
      else {
        run = 1;
        start = b.minute;
      }
      if (!best || run > best.minutes) best = { minutes: run, start };
    } else run = 0;
    prev = b;
  }
  return best;
}

/** The clock hour with the lowest good share, among hours with at least `minSittingMinutes` sitting. */
export function worstHour(
  buckets: MinuteBucket[],
  minSittingMinutes: number,
): { hour: number; share: number } | null {
  const hours = new Map<number, { good: number; drift: number }>();
  for (const b of buckets) {
    const h = Math.floor(b.minute / 60);
    const row = hours.get(h) ?? { good: 0, drift: 0 };
    row.good += b.good_s;
    row.drift += b.drift_s;
    hours.set(h, row);
  }
  let worst: { hour: number; share: number } | null = null;
  for (const [hour, { good, drift }] of [...hours].sort((a, b) => a[0] - b[0])) {
    if (good + drift < minSittingMinutes * 60) continue;
    const share = good / (good + drift);
    if (!worst || share < worst.share) worst = { hour, share };
  }
  return worst;
}

export function dailySummaries(buckets: MinuteBucket[]): DaySummary[] {
  const days = new Map<string, DaySummary>();
  for (const b of buckets) {
    const d = days.get(b.day) ?? {
      date: b.day,
      good_s: 0,
      drift_s: 0,
      absent_s: 0,
      unknown_s: 0,
      share: null,
    };
    d.good_s += b.good_s;
    d.drift_s += b.drift_s;
    d.absent_s += b.absent_s;
    d.unknown_s += b.unknown_s;
    days.set(b.day, d);
  }
  return [...days.values()]
    .map((d) => ({ ...d, share: shareOf(d.good_s, d.drift_s) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;

/**
 * A day against the mean share of the previous `windowDays` calendar days that have sitting time.
 * Null when the window holds no such day or the day itself has none.
 */
export function compareToAverage(
  summaries: DaySummary[],
  date: string,
  windowDays: number,
): { average: number; delta: number } | null {
  const today = summaries.find((d) => d.date === date)?.share;
  if (today === null || today === undefined) return null;
  const n = dayNumber(date);
  const previous = summaries
    .filter((d) => d.share !== null && dayNumber(d.date) < n && dayNumber(d.date) >= n - windowDays)
    .map((d) => d.share as number);
  if (previous.length === 0) return null;
  const average = previous.reduce((a, b) => a + b, 0) / previous.length;
  return { average, delta: today - average };
}

/** Runs of days at or above the goal share. Days without sitting time neither count nor break a run. */
export function dayStreaks(
  summaries: DaySummary[],
  goal: number,
): { current: number; best: number } {
  let current = 0;
  let best = 0;
  for (const d of summaries) {
    if (d.share === null) continue;
    current = d.share >= goal ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

/**
 * One letter per step of `stepMinutes` from the first sitting step to the last: G good, D drift,
 * A away (away, unwatched, or no session), by whichever held the most seconds of the step.
 */
export function ribbon(
  buckets: MinuteBucket[],
  stepMinutes: number,
): { start: number; states: string } {
  if (buckets.length === 0) return { start: 0, states: '' };
  const minutes = buckets.map((b) => b.minute);
  const start = Math.floor(Math.min(...minutes) / stepMinutes) * stepMinutes;
  const steps = Math.floor((Math.max(...minutes) - start) / stepMinutes) + 1;
  const tally = Array.from({ length: steps }, () => ({ G: 0, D: 0, A: 0 }));
  for (const b of buckets) {
    const t = tally[Math.floor((b.minute - start) / stepMinutes)];
    if (!t) continue;
    t.G += b.good_s;
    t.D += b.drift_s;
    t.A += b.absent_s + b.unknown_s;
  }
  const states = tally
    .map((t) => {
      const sat = t.G + t.D;
      if (sat === 0 || t.A > sat) return 'A';
      return t.D > t.G ? 'D' : 'G';
    })
    .join('');
  return { start, states };
}

/** Good share per weekday (rows, Monday first) and clock hour (columns fromHour..toHour). */
export function hourWeekdayGrid(
  buckets: MinuteBucket[],
  fromHour: number,
  toHour: number,
): (number | null)[][] {
  const cols = toHour - fromHour + 1;
  const cells = Array.from({ length: 7 }, () =>
    Array.from({ length: cols }, () => ({ good: 0, drift: 0 })),
  );
  for (const b of buckets) {
    const row = (new Date(`${b.day}T00:00:00Z`).getUTCDay() + 6) % 7;
    const cell = cells[row]?.[Math.floor(b.minute / 60) - fromHour];
    if (!cell) continue;
    cell.good += b.good_s;
    cell.drift += b.drift_s;
  }
  return cells.map((r) => r.map((c) => shareOf(c.good, c.drift)));
}

/** Share of drift time that fell at or after `hour`. Null without drift. */
export function driftShareFrom(buckets: MinuteBucket[], hour: number): number | null {
  let late = 0;
  let all = 0;
  for (const b of buckets) {
    all += b.drift_s;
    if (b.minute >= hour * 60) late += b.drift_s;
  }
  return all > 0 ? late / all : null;
}

export interface ObservationRule {
  when: readonly { metric: string; op: 'lt' | 'lte' | 'gt' | 'gte'; value: number }[];
  text: string;
}

const compare = {
  lt: (a: number, b: number) => a < b,
  lte: (a: number, b: number) => a <= b,
  gt: (a: number, b: number) => a > b,
  gte: (a: number, b: number) => a >= b,
};

/**
 * The first rule whose conditions all hold, with `{slot}`s filled from `slots`, then from metrics.
 * A condition on a metric that is missing does not hold.
 */
export function pickObservation(
  rules: readonly ObservationRule[],
  metrics: Record<string, number | undefined>,
  slots: Record<string, string>,
): string | null {
  const rule = rules.find((r) =>
    r.when.every((c) => {
      const v = metrics[c.metric];
      return v !== undefined && compare[c.op](v, c.value);
    }),
  );
  if (!rule) return null;
  return rule.text.replaceAll(/\{(\w+)\}/g, (slot, key: string) => {
    if (slots[key] !== undefined) return slots[key];
    const v = metrics[key];
    return v === undefined ? slot : String(v);
  });
}
