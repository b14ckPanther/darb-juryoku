import { describe, expect, it } from 'vitest';
import { ConfigError } from '../../config/load-config';
import { parseDesignTokens, resolveColour } from './load-tokens';

import { brand, rawTokens } from '../../test/design-fixtures';

describe('parseDesignTokens', () => {
  it('loads the committed tokens and the approved brand palette', () => {
    const tokens = parseDesignTokens(rawTokens, brand, 'config/design/tokens.yaml');
    expect(tokens.themes.dark.surface).toBe('night');
    expect(tokens.colours['gold']).toBe('#D9A54C');
    expect(tokens.colours['amber']).toBe('#B8652B');
    expect(tokens.motion.springs.settle.stiffness).toBe(170);
  });

  it('rejects a theme that misses a required role and names it', () => {
    const broken = rawTokens.replace(/\n {4}drift_text: amber_light/, '');
    expect(() => parseDesignTokens(broken, brand, 'tokens.yaml')).toThrow(ConfigError);
    expect(() => parseDesignTokens(broken, brand, 'tokens.yaml')).toThrow(/drift_text/);
  });

  it('rejects a colour that names nothing in the brand or palette', () => {
    const broken = rawTokens.replace('surface: night', 'surface: midnight');
    expect(() => parseDesignTokens(broken, brand, 'tokens.yaml')).toThrow(/midnight/);
  });

  it('rejects a palette name that shadows a brand colour', () => {
    const broken = rawTokens.replace("amber: '#B8652B'", "gold: '#B8652B'");
    expect(() => parseDesignTokens(broken, brand, 'tokens.yaml')).toThrow(/gold/);
  });

  it('rejects a malformed hex', () => {
    const broken = rawTokens.replace("amber: '#B8652B'", "amber: '#C982'");
    expect(() => parseDesignTokens(broken, brand, 'tokens.yaml')).toThrow(/palette\/amber/);
  });
});

describe('resolveColour', () => {
  const colours = { gold: '#D9A54C', night: '#03110C' };

  it('resolves names and hex values', () => {
    expect(resolveColour('gold', colours)).toEqual({ hex: '#D9A54C', alpha: 1 });
    expect(resolveColour('#123456', colours)).toEqual({ hex: '#123456', alpha: 1 });
  });

  it('resolves an opacity suffix', () => {
    expect(resolveColour('night/60', colours)).toEqual({ hex: '#03110C', alpha: 0.6 });
  });

  it('throws on an unknown name', () => {
    expect(() => resolveColour('silver', colours)).toThrow(/silver/);
  });
});
