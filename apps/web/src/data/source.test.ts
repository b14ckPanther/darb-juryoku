import { describe, expect, it, vi } from 'vitest';
import { bucketsFromSeed, loadDemoSnapshot, parseLibrary } from './demo-seed';
import { resolveDemo } from './mode';
import { emptySnapshot, loadSnapshot } from './source';

describe('resolveDemo', () => {
  it('follows ?demo=1 and ?demo=0 over everything else', () => {
    expect(resolveDemo({ search: '?demo=1', stored: '0', buildDefault: false })).toBe(true);
    expect(resolveDemo({ search: '?demo=0', stored: '1', buildDefault: true })).toBe(false);
  });
  it('then the remembered choice, then the build default', () => {
    expect(resolveDemo({ search: '', stored: '1', buildDefault: false })).toBe(true);
    expect(resolveDemo({ search: '', stored: null, buildDefault: true })).toBe(true);
    expect(resolveDemo({ search: '?demo=yes', stored: null, buildDefault: false })).toBe(false);
  });
});

describe('loadSnapshot', () => {
  it('loads the seed in demo mode', async () => {
    const snap = await loadSnapshot(true);
    expect(snap.demo).toBe(true);
    expect(snap.buckets.length).toBeGreaterThan(1000);
    expect(snap.library?.models.length).toBe(2);
  });

  it('never touches the seed outside demo mode', async () => {
    const loadDemo = vi.fn();
    const snap = await loadSnapshot(false, new Date(2026, 9, 27, 10), loadDemo, async (now) =>
      emptySnapshot(now),
    );
    expect(loadDemo).not.toHaveBeenCalled();
    expect(snap).toEqual({
      demo: false,
      today: '2026-10-27',
      sessions: [],
      buckets: [],
      library: null,
    });
  });
});

describe('demo seed', () => {
  const snap = loadDemoSnapshot();

  it('ends on the recipe date and has minutes on it', () => {
    expect(snap.today).toBe('2026-10-26');
    expect(snap.buckets.some((b) => b.day === snap.today)).toBe(true);
  });

  it('turns each letter into one full minute', () => {
    const b = bucketsFromSeed({
      codes: { u: 'upright', s: 'slouch', a: 'absent' },
      sessions: [
        { id: 'x', date: '2026-10-26', start: '09:30', model: 'v', device: 'd', minutes: 'usa' },
      ],
    });
    expect(b.map((m) => [m.minute, m.good_s, m.drift_s, m.absent_s])).toEqual([
      [570, 60, 0, 0],
      [571, 0, 60, 0],
      [572, 0, 0, 60],
    ]);
  });

  it('rejects a confusion matrix of the wrong size', () => {
    const bad = `calibrations: [{ id: a, name: A, camera: C, created: '2026-10-01', active: true }]
cameras: [C]
classes: [upright, slouch]
gates: { macro_f1: 0.8, slouch_recall: 0.8, beats_heuristic: 0.05, wasm_p95_ms: 8 }
heuristic: { confusion: [[1, 2, 3], [4, 5, 6]] }
models: []
recordings: []
playback: { seconds_per_key: 1, match: [1, 0], state_from: { upright: 0.7 }, match_when_still: 0.5, match_example_drift: 0.3, match_framing: 0.5, tick_ms: 250, bench_ms: 1, drift_class: slouch, nudge_after_seconds: 1, quiet_after_nudge_seconds: 1 }
studio_speed: 2
studio_kb_per_second: 1
`;
    expect(() => parseLibrary(bad, 'library.yaml')).toThrow(/heuristic\.confusion must be 2 by 2/);
  });
});

describe('seed sessions', () => {
  it('rejects a session that runs past midnight', async () => {
    const { parseSeedSessions } = await import('./demo-seed');
    const yaml = `codes: { u: upright, s: slouch, f: forward_head, l: lean_side, a: absent, x: unknown }
sessions:
  - { id: late, date: '2026-10-26', start: '23:58', model: v, device: d, minutes: uuuu }
`;
    expect(() => parseSeedSessions(yaml, 'sessions.yaml')).toThrow(/late runs past midnight/);
  });
});
