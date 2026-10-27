import { describe, expect, it } from 'vitest';
import rawRecipe from '../../../../config/seed/demo/recipe.yaml?raw';
import { generateSessions, parseRecipe, weekdayOf } from './generate-sessions';

const recipe = parseRecipe(rawRecipe, 'recipe.yaml');
const out = generateSessions(recipe);
const codes = Object.fromEntries(Object.entries(out.codes).map(([k, v]) => [v, k]));

const driftShare = (filter: (date: string, minuteOfDay: number) => boolean) => {
  let drift = 0;
  let sitting = 0;
  for (const s of out.sessions) {
    const [h = 0, m = 0] = s.start.split(':').map(Number);
    [...s.minutes].forEach((c, i) => {
      if (!filter(s.date, h * 60 + m + i)) return;
      const state = out.codes[c];
      if (state === 'upright') sitting += 1;
      if (state === 'slouch' || state === 'forward_head' || state === 'lean_side') {
        sitting += 1;
        drift += 1;
      }
    });
  }
  return drift / sitting;
};

describe('generateSessions (demo seed)', () => {
  it('gives the same minutes for the same recipe', () => {
    expect(generateSessions(recipe)).toEqual(out);
  });

  it('covers the recipe days and ends on its end date', () => {
    const dates = [...new Set(out.sessions.map((s) => s.date))].sort();
    expect(dates.at(-1)).toBe(recipe.end_date);
    expect(dates.length).toBeGreaterThanOrEqual(15);
    expect(dates.length).toBeLessThanOrEqual(recipe.days);
  });

  it('writes only known state letters and unique session ids', () => {
    for (const s of out.sessions)
      expect(s.minutes).toMatch(new RegExp(`^[${Object.keys(out.codes).join('')}]+$`));
    expect(new Set(out.sessions.map((s) => s.id)).size).toBe(out.sessions.length);
    expect(codes['upright']).toBeDefined();
  });

  it('slumps in the afternoon', () => {
    const morning = driftShare((_, m) => m < 12 * 60);
    const afternoon = driftShare((_, m) => m >= 14 * 60 && m < 17 * 60);
    expect(afternoon).toBeGreaterThan(morning + 0.1);
  });

  it('drops on Fridays', () => {
    const friday = driftShare((d) => weekdayOf(d) === 'fri');
    const midweek = driftShare((d) => ['tue', 'wed', 'thu'].includes(weekdayOf(d)));
    expect(friday).toBeGreaterThan(midweek + 0.05);
  });

  it('names 2026-10-26 a Monday', () => {
    expect(weekdayOf('2026-10-26')).toBe('mon');
  });
});
