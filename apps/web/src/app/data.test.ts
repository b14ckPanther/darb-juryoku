import { describe, expect, it } from 'vitest';
import { loadDemoSnapshot } from '../data/demo-seed';
import { emptySnapshot } from '../data/source';
import { dataReducer } from './data';

const demo = loadDemoSnapshot();

describe('dataReducer', () => {
  it('deletes one day and keeps the others', () => {
    const next = dataReducer(demo, { type: 'delete_day', date: demo.today });
    expect(next.buckets.some((b) => b.day === demo.today)).toBe(false);
    expect(next.buckets.length).toBeGreaterThan(0);
  });

  it('keeps exactly one calibration in use', () => {
    const id = demo.library?.calibrations[1]?.id ?? '';
    const next = dataReducer(demo, { type: 'use_calibration', id });
    expect(next.library?.calibrations.filter((c) => c.active).map((c) => c.id)).toEqual([id]);
    const added = dataReducer(next, {
      type: 'add_calibration',
      calibration: { id: 'new', name: 'New', camera: 'C', created: demo.today },
    });
    expect(added.library?.calibrations.filter((c) => c.active).map((c) => c.id)).toEqual(['new']);
  });

  it('switches to the heuristic by making no model active', () => {
    const next = dataReducer(demo, { type: 'use_model', name: null });
    expect(next.library?.models.some((m) => m.active)).toBe(false);
  });

  it('adds, deletes and clears recordings', () => {
    const rec = {
      id: 'r',
      date: demo.today,
      protocol: 'guided' as const,
      seconds: 1,
      size_kb: 1,
      lighting: 'morning',
      chair: 'desk_chair',
      camera: 'built_in',
    };
    const added = dataReducer(demo, { type: 'add_recording', recording: rec });
    expect(added.library?.recordings.at(-1)?.id).toBe('r');
    expect(dataReducer(added, { type: 'delete_recording', id: 'r' }).library?.recordings).toEqual(
      demo.library?.recordings,
    );
    expect(dataReducer(added, { type: 'clear_recordings' }).library?.recordings).toEqual([]);
  });

  it('leaves real-mode data without a library alone', () => {
    const empty = emptySnapshot(new Date(2026, 9, 27));
    expect(dataReducer(empty, { type: 'use_model', name: null })).toBe(empty);
  });
});
