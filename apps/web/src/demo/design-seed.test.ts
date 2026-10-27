import { describe, expect, it } from 'vitest';
import rawSeed from '../../../../config/seed/demo/design.yaml?raw';
import { ConfigError } from '../config/load-config';
import { parseDesignSeed } from './design-seed';

describe('parseDesignSeed', () => {
  it('loads the committed demo seed', () => {
    const seed = parseDesignSeed(rawSeed, 'design.yaml');
    expect(seed.banner.demo).toBe('Demo data');
    expect(seed.model.confusion).toHaveLength(seed.model.classes.length);
  });

  it('rejects a heatmap row with the wrong number of hours', () => {
    const broken = rawSeed.replace('[82, 85, 80, 74, 66, 61, 52, 55, 63, 70]', '[82, 85]');
    expect(() => parseDesignSeed(broken, 'design.yaml')).toThrow(ConfigError);
    expect(() => parseDesignSeed(broken, 'design.yaml')).toThrow(/heatmap row 1/);
  });

  it('rejects a confusion matrix that is not one row and column per class', () => {
    const broken = rawSeed.replace('- [9, 14, 4, 187]', '- [9, 14, 4]');
    expect(() => parseDesignSeed(broken, 'design.yaml')).toThrow(/confusion row 4/);
  });

  it('rejects a class without a label', () => {
    const broken = rawSeed.replace('lean_side: Lean }', 'lean: Lean }');
    expect(() => parseDesignSeed(broken, 'design.yaml')).toThrow(/lean_side/);
  });
});
