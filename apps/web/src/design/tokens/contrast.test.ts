import { describe, expect, it } from 'vitest';
import { contrastChecks, contrastRatio, oklabDelta, separationChecks } from './contrast';

import { tokens } from '../../test/design-fixtures';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#D9A54C', '#D9A54C')).toBe(1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#03110C', '#FBF7EC')).toBeCloseTo(
      contrastRatio('#FBF7EC', '#03110C'),
      10,
    );
  });
});

describe('token contrast (WCAG 2.2 AA)', () => {
  const checks = contrastChecks(tokens);

  it('checks every theme and every direction', () => {
    const scopes = new Set(checks.map((c) => c.scope));
    expect(scopes).toEqual(
      new Set([
        'theme:dark',
        'theme:light',
        'direction:instrument',
        'direction:ledger',
        'direction:monitor',
      ]),
    );
  });

  it('only compares opaque colours', () => {
    expect(checks.filter((c) => !c.opaque).map((c) => c.label)).toEqual([]);
  });

  it.each(checks.map((c) => [c.label, c] as const))('%s', (_label, check) => {
    expect(
      check.ratio,
      `${check.label}: ${check.ratio.toFixed(2)}:1, needs ${check.min}:1`,
    ).toBeGreaterThanOrEqual(check.min);
  });
});

describe('oklabDelta', () => {
  it('is zero for one colour and about 100 between black and white', () => {
    expect(oklabDelta('#D9A54C', '#D9A54C')).toBe(0);
    expect(oklabDelta('#000000', '#FFFFFF')).toBeCloseTo(100, 0);
  });
});

describe('good and drift marks are told apart by more than lightness', () => {
  const checks = separationChecks(tokens);

  it('checks the themes the app ships', () => {
    expect(checks.map((c) => c.scope)).toEqual(
      expect.arrayContaining(['theme:dark', 'theme:light']),
    );
  });

  it.each(checks.filter((c) => c.scope.startsWith('theme:')).map((c) => [c.label, c] as const))(
    '%s',
    (_l, check) => {
      expect(
        check.delta,
        `${check.label}: OKLab delta ${check.delta.toFixed(1)}`,
      ).toBeGreaterThanOrEqual(check.min);
    },
  );
});
