import { describe, expect, it } from 'vitest';
import { copy } from '../copy';
import { reportConfig } from '../config/runtime';
import { loadDemoSnapshot } from '../data/demo-seed';
import { buildDayReport } from './day-report';
import { duration, points } from './format';

describe('buildDayReport on the demo seed', () => {
  const snap = loadDemoSnapshot();
  const report = buildDayReport(snap.buckets, snap.today, reportConfig, copy);

  it('fills every Today number', () => {
    expect(report.share).toBeGreaterThan(0.4);
    expect(report.share).toBeLessThan(1);
    expect(report.longestDrift?.minutes).toBeGreaterThan(0);
    expect(report.worstHour).not.toBeNull();
    expect(report.comparison).not.toBeNull();
    expect(report.ribbon.states.length).toBeGreaterThan(20);
    expect(report.observation).toMatch(/\S/);
    expect(report.observation).not.toMatch(/\{/);
  });

  it('is empty, not wrong, for a day without sessions', () => {
    const none = buildDayReport(snap.buckets, '2020-01-01', reportConfig, copy);
    expect(none).toMatchObject({
      share: null,
      longestDrift: null,
      observation: null,
      sittingMinutes: 0,
    });
  });
});

describe('format', () => {
  it('writes durations in minutes, then hours', () => {
    expect(duration(50, copy.units)).toBe('50 min');
    expect(duration(60, copy.units)).toBe('1 h');
    expect(duration(72, copy.units)).toBe('1 h 12 min');
  });
  it('writes a signed points difference with a real minus sign', () => {
    expect(points(0.114, copy.units)).toBe('+11 points');
    expect(points(-0.04, copy.units)).toBe('−4 points');
  });
});

describe('observation rules', () => {
  const mk = (minute: number, drift: boolean) => ({
    sessionId: 's',
    day: '2026-10-26',
    minute,
    good_s: drift ? 0 : 60,
    drift_s: drift ? 60 : 0,
    absent_s: 0,
    unknown_s: 0,
    dominant: drift ? ('slouch' as const) : ('upright' as const),
  });

  it('does not blame the afternoon for a near-perfect day with two late drift minutes', () => {
    const day = [
      ...Array.from({ length: 200 }, (_, i) => mk(9 * 60 + i, false)),
      mk(15 * 60 + 10, true),
      mk(15 * 60 + 11, true),
    ];
    const r = buildDayReport(day, '2026-10-26', reportConfig, copy);
    expect(r.observation).not.toMatch(/after/);
  });
});
