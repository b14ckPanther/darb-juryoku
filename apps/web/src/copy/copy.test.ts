import { describe, expect, it } from 'vitest';
import { copy, t } from '.';

describe('copy', () => {
  it('loads every screen section', () => {
    expect(copy.today.title).toBeTruthy();
    expect(copy.lab.facts.macro_f1).toBeTruthy();
  });

  it('fills slots and leaves unknown slots visible', () => {
    expect(t('{n} min of {total}', { n: 3, total: '5 min' })).toBe('3 min of 5 min');
    expect(t('{missing}')).toBe('{missing}');
  });
});
