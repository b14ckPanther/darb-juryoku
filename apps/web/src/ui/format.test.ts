import { describe, expect, it } from 'vitest';
import { fillTemplate, formatPercent } from './format';

describe('format', () => {
  it('fills named slots from config copy and leaves unknown slots visible', () => {
    expect(fillTemplate('{action}, {row}', { action: 'Delete', row: 'Monday' })).toBe(
      'Delete, Monday',
    );
    expect(fillTemplate('{action}, {missing}', { action: 'Export' })).toBe('Export, {missing}');
  });

  it('formats a fraction as a whole percent', () => {
    expect(formatPercent(0.849).replace(/\s/g, '')).toMatch(/85/);
  });
});
