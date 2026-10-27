import { describe, expect, it } from 'vitest';
import rawCopy from '../../../../config/copy/en.yaml?raw';
import generated from './copy.gen.ts?raw';
import { copyTypeSource } from './copy-type';

describe('copyTypeSource', () => {
  it('turns strings, lists and nested maps into a TypeScript interface', () => {
    const src = copyTypeSource('a: x\nb: [y, z]\nc:\n  d: w\n  "1": v\n');
    expect(src).toContain('export interface Copy {');
    expect(src).toContain('  a: string;');
    expect(src).toContain('  b: string[];');
    expect(src).toContain('    d: string;');
    expect(src).toContain("    '1': string;");
  });

  it('matches the committed copy.gen.ts (run `pnpm --filter web copy:types` after editing en.yaml)', () => {
    expect(generated).toBe(copyTypeSource(rawCopy));
  });
});
