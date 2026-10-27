import { describe, expect, it } from 'vitest';
import { checkGates, classMetrics } from './metrics';

describe('classMetrics', () => {
  it('reads precision down columns and recall along rows', () => {
    const { perClass, macroF1 } = classMetrics([
      [8, 2],
      [1, 9],
    ]);
    expect(perClass[0]?.precision).toBeCloseTo(8 / 9);
    expect(perClass[0]?.recall).toBeCloseTo(0.8);
    expect(perClass[1]?.support).toBe(10);
    const f1 = (p: number, r: number) => (2 * p * r) / (p + r);
    expect(macroF1).toBeCloseTo((f1(8 / 9, 0.8) + f1(9 / 11, 0.9)) / 2);
  });
  it('gives zero, not NaN, for a class never predicted', () => {
    expect(
      classMetrics([
        [0, 5],
        [0, 5],
      ]).perClass[0],
    ).toEqual({ precision: 0, recall: 0, f1: 0, support: 5 });
  });
});

describe('checkGates', () => {
  const gates = { macro_f1: 0.85, slouch_recall: 0.85, beats_heuristic: 0.05, wasm_p95_ms: 8 };
  it('passes each gate at its threshold and fails below it', () => {
    const at = checkGates(
      { macroF1: 0.85, slouchRecall: 0.85, heuristicMacroF1: 0.8, wasmP95: 8 },
      gates,
    );
    expect(at.every((g) => g.pass)).toBe(true);
    const below = checkGates(
      { macroF1: 0.84, slouchRecall: 0.7, heuristicMacroF1: 0.8, wasmP95: 9 },
      gates,
    );
    expect(below.map((g) => g.pass)).toEqual([false, false, false, false]);
  });
});
