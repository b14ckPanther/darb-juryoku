import { describe, expect, it } from 'vitest';
import { matchRoute, navType } from './routes';

describe('matchRoute', () => {
  it.each([
    ['/', 'live'],
    ['/welcome', 'welcome'],
    ['/calibrate', 'calibrate'],
    ['/sentinel', 'sentinel'],
    ['/nudges', 'nudges'],
    ['/today/', 'today'],
    ['/history', 'history'],
    ['/studio', 'studio'],
    ['/lab', 'lab'],
    ['/settings', 'settings'],
    ['/nope', 'not_found'],
    ['/history/26-10', 'not_found'],
  ])('%s is %s', (path, screen) => {
    expect(matchRoute(path).screen).toBe(screen);
  });

  it('reads the date of a day report', () => {
    expect(matchRoute('/history/2026-10-23')).toEqual({
      screen: 'day',
      params: { date: '2026-10-23' },
    });
  });
});

describe('navType', () => {
  it('slides forward into a day, back out of it, and fades between tabs', () => {
    expect(navType('history', 'day')).toBe('nav-forward');
    expect(navType('day', 'history')).toBe('nav-back');
    expect(navType('today', 'settings')).toBe('nav-lateral');
  });
});
