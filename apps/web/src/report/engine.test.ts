import { describe, expect, it } from 'vitest';
import {
  compareToAverage,
  dailySummaries,
  dayStreaks,
  driftShareFrom,
  goodShare,
  hourWeekdayGrid,
  longestDrift,
  pickObservation,
  ribbon,
  worstHour,
} from './engine';
import type { MinuteBucket, MinuteState } from './types';

const code: Record<string, MinuteState> = {
  u: 'upright',
  s: 'slouch',
  f: 'forward_head',
  l: 'lean_side',
  a: 'absent',
  x: 'unknown',
};

/** One full-minute bucket per letter, starting at hh:mm on the day. */
function mk(day: string, start: string, letters: string, sessionId = `${day}-${start}`) {
  const [h = 0, m = 0] = start.split(':').map(Number);
  return [...letters].map((c, i): MinuteBucket => {
    const s = code[c] ?? 'unknown';
    const drift = s === 'slouch' || s === 'forward_head' || s === 'lean_side';
    return {
      sessionId,
      day,
      minute: h * 60 + m + i,
      good_s: s === 'upright' ? 60 : 0,
      drift_s: drift ? 60 : 0,
      absent_s: s === 'absent' ? 60 : 0,
      unknown_s: s === 'unknown' ? 60 : 0,
      dominant: s,
    };
  });
}

describe('goodShare', () => {
  it('is good time over sitting time, ignoring away and unwatched minutes', () => {
    expect(goodShare(mk('2026-10-26', '09:00', 'uuusaaxx'))).toBe(0.75);
  });
  it('is null when nobody sat', () => {
    expect(goodShare(mk('2026-10-26', '09:00', 'aax'))).toBeNull();
    expect(goodShare([])).toBeNull();
  });
});

describe('longestDrift', () => {
  it('counts the longest run of drift minutes, any drift kind', () => {
    const run = longestDrift(mk('2026-10-26', '09:00', 'uussuusfluu'));
    expect(run).toEqual({ minutes: 3, start: 9 * 60 + 6 });
  });
  it('a minute away breaks the run, and so does a gap between sessions', () => {
    const b = [...mk('2026-10-26', '09:00', 'ssass'), ...mk('2026-10-26', '09:10', 'sss', 'two')];
    expect(longestDrift(b)?.minutes).toBe(3);
    const gap = [...mk('2026-10-26', '09:00', 'ss'), ...mk('2026-10-26', '09:03', 'ss', 'other')];
    expect(longestDrift(gap)?.minutes).toBe(2);
  });
  it('is null without drift', () => {
    expect(longestDrift(mk('2026-10-26', '09:00', 'uuu'))).toBeNull();
  });
});

describe('worstHour', () => {
  it('finds the clock hour with the lowest good share', () => {
    const b = [
      ...mk('2026-10-26', '09:00', 'u'.repeat(50) + 's'.repeat(10)),
      ...mk('2026-10-26', '15:00', 'u'.repeat(20) + 's'.repeat(40)),
    ];
    expect(worstHour(b, 20)).toEqual({ hour: 15, share: 20 / 60 });
  });
  it('skips hours with less sitting than the minimum', () => {
    const b = [
      ...mk('2026-10-26', '09:00', 'u'.repeat(30) + 's'.repeat(30)),
      ...mk('2026-10-26', '15:00', 'sssss'),
    ];
    expect(worstHour(b, 20)?.hour).toBe(9);
  });
  it('is null when no hour has enough sitting', () => {
    expect(worstHour(mk('2026-10-26', '09:00', 'uuu'), 20)).toBeNull();
  });
});

describe('dailySummaries and the 7-day comparison', () => {
  const days = [
    ...mk('2026-10-19', '09:00', 'uuuuuuuuss'), // 80
    ...mk('2026-10-20', '09:00', 'uuuuuussss'), // 60
    ...mk('2026-10-21', '09:00', 'aaaa'), // nobody sat
    ...mk('2026-10-26', '09:00', 'uuuuuuuuus'), // 90
  ];
  const summaries = dailySummaries(days);

  it('summarises each day in date order with its share', () => {
    expect(summaries.map((d) => [d.date, d.share])).toEqual([
      ['2026-10-19', 0.8],
      ['2026-10-20', 0.6],
      ['2026-10-21', null],
      ['2026-10-26', 0.9],
    ]);
  });

  it('compares a day with the mean of the previous days in the window that have sitting time', () => {
    const c = compareToAverage(summaries, '2026-10-26', 7);
    expect(c?.average).toBeCloseTo(0.7);
    expect(c?.delta).toBeCloseTo(0.2);
  });

  it('leaves out days older than the window', () => {
    expect(compareToAverage(summaries, '2026-10-26', 6)?.average).toBeCloseTo(0.6);
    expect(compareToAverage(summaries, '2026-10-26', 3)).toBeNull();
  });
});

describe('dayStreaks', () => {
  const day = (date: string, share: number | null) => ({
    date,
    share,
    good_s: 0,
    drift_s: 0,
    absent_s: 0,
    unknown_s: 0,
  });
  it('counts days at or above the goal; days without sitting neither count nor break', () => {
    const s = [
      day('2026-10-19', 0.8),
      day('2026-10-20', 0.8),
      day('2026-10-21', 0.6),
      day('2026-10-22', 0.76),
      day('2026-10-23', null),
      day('2026-10-24', 0.9),
      day('2026-10-25', 0.75),
    ];
    expect(dayStreaks(s, 0.75)).toEqual({ current: 3, best: 3 });
    expect(dayStreaks(s.slice(0, 3), 0.75)).toEqual({ current: 0, best: 2 });
  });
});

describe('ribbon', () => {
  it('draws a day in fixed steps: good, drift or away, by what held most of each step', () => {
    const b = [
      ...mk('2026-10-26', '09:05', 'uuuuu' + 'ssssu' + 'aaaxx'),
      ...mk('2026-10-26', '09:30', 'uuuuu', 'b'),
    ];
    expect(ribbon(b, 5)).toEqual({ start: 9 * 60 + 5, states: 'GDAAAG' });
  });
  it('starts on a step boundary', () => {
    expect(ribbon(mk('2026-10-26', '09:07', 'uuu'), 10)).toEqual({ start: 9 * 60, states: 'G' });
  });
  it('is empty for no minutes', () => {
    expect(ribbon([], 10)).toEqual({ start: 0, states: '' });
  });
});

describe('hourWeekdayGrid', () => {
  it('gives the good share per weekday (Monday first) and hour, null where nobody sat', () => {
    const b = [...mk('2026-10-26', '09:00', 'uuus'), ...mk('2026-10-23', '10:00', 'ss')];
    const grid = hourWeekdayGrid(b, 9, 10);
    expect(grid[0]).toEqual([0.75, null]); // Monday
    expect(grid[4]).toEqual([null, 0]); // Friday
    expect(grid[6]).toEqual([null, null]);
  });
});

describe('driftShareFrom', () => {
  it('is the share of drift minutes at or after the hour', () => {
    const b = [...mk('2026-10-26', '09:00', 'ss'), ...mk('2026-10-26', '15:00', 'ssssss', 'b')];
    expect(driftShareFrom(b, 15)).toBe(0.75);
    expect(driftShareFrom(mk('2026-10-26', '09:00', 'uu'), 15)).toBeNull();
  });
});

describe('pickObservation', () => {
  const rules = [
    { when: [{ metric: 'delta_points', op: 'gte', value: 8 }], text: 'Up {delta_points} points.' },
    {
      when: [{ metric: 'afternoon_drift_share', op: 'gte', value: 0.6 }],
      text: 'Mostly after {afternoon_from}.',
    },
    { when: [], text: 'You sat well for {good_percent} of the time.' },
  ] as const;

  it('uses the first rule whose conditions all hold, and fills its slots', () => {
    const text = pickObservation(
      rules,
      { delta_points: 3, afternoon_drift_share: 0.7 },
      { afternoon_from: '15:00' },
    );
    expect(text).toBe('Mostly after 15:00.');
  });
  it('skips a rule whose metric is missing', () => {
    expect(pickObservation(rules, { good_percent: 0.5 }, { good_percent: '50%' })).toBe(
      'You sat well for 50% of the time.',
    );
  });
  it('fills numeric slots from metrics', () => {
    expect(pickObservation(rules, { delta_points: 9 }, {})).toBe('Up 9 points.');
  });
});
