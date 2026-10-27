/** Per-class precision, recall, F1 and support from a confusion matrix (rows actual, columns predicted). */
export function classMetrics(confusion: number[][]) {
  const n = confusion.length;
  const col = (j: number) => confusion.reduce((s, row) => s + (row[j] ?? 0), 0);
  const perClass = confusion.map((row, i) => {
    const tp = row[i] ?? 0;
    const support = row.reduce((a, b) => a + b, 0);
    const predicted = col(i);
    const precision = predicted ? tp / predicted : 0;
    const recall = support ? tp / support : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { precision, recall, f1, support };
  });
  const macroF1 = n ? perClass.reduce((s, c) => s + c.f1, 0) / n : 0;
  return { perClass, macroF1 };
}

export interface GateInput {
  macroF1: number;
  slouchRecall: number;
  heuristicMacroF1: number;
  wasmP95: number;
}

export interface Gates {
  macro_f1: number;
  slouch_recall: number;
  beats_heuristic: number;
  wasm_p95_ms: number;
}

// Metrics are rounded reports of measurements, so a value exactly at a threshold must pass.
const EPS = 1e-9;

/** Each release gate with its threshold and whether the model meets it. */
export function checkGates(m: GateInput, g: Gates) {
  return [
    { id: 'macro_f1' as const, threshold: g.macro_f1, pass: m.macroF1 >= g.macro_f1 - EPS },
    {
      id: 'slouch_recall' as const,
      threshold: g.slouch_recall,
      pass: m.slouchRecall >= g.slouch_recall - EPS,
    },
    {
      id: 'beats_heuristic' as const,
      threshold: g.beats_heuristic,
      pass: m.macroF1 - m.heuristicMacroF1 >= g.beats_heuristic - EPS,
    },
    {
      id: 'wasm_p95_ms' as const,
      threshold: g.wasm_p95_ms,
      pass: m.wasmP95 <= g.wasm_p95_ms + EPS,
    },
  ];
}
