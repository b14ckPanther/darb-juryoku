import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  activeCalibration,
  deleteEverything,
  listCalibrations,
  saveCalibration,
  selectCalibration,
} from './calibrations';
import { JuryokuDb } from './db';
import { readSnapshot, writeMinutes } from './minutes';

let n = 0;
const fresh = () => new JuryokuDb(`test-${(n += 1)}`);
const cal = (id: string, createdAt: number) => ({
  id,
  name: id,
  camera: 'Cam',
  created: '2026-10-27',
  createdAt,
  landmarks: [[0.5, 0.5, 0, 1]],
  features: { shoulder_width: 0.3 },
  aspect: 4 / 3,
  featuresHash: 'h',
});

describe('calibration storage', () => {
  it('keeps exactly one calibration in use', async () => {
    const d = fresh();
    await saveCalibration(d, cal('a', 1));
    await saveCalibration(d, cal('b', 2));
    expect((await activeCalibration(d))?.id).toBe('b');
    await selectCalibration(d, 'a');
    expect((await listCalibrations(d)).map((c) => [c.id, c.active])).toEqual([
      ['a', true],
      ['b', false],
    ]);
  });

  it('stores the ideal landmarks and features, never anything image-like', async () => {
    const d = fresh();
    await saveCalibration(d, cal('a', 1));
    const stored = await activeCalibration(d);
    expect(Object.keys(stored ?? {}).sort()).toEqual(
      [
        'active',
        'aspect',
        'camera',
        'created',
        'createdAt',
        'features',
        'featuresHash',
        'id',
        'landmarks',
        'name',
      ].sort(),
    );
  });

  it('deletes everything', async () => {
    const d = fresh();
    await saveCalibration(d, cal('a', 1));
    await deleteEverything(d);
    expect(await activeCalibration(d)).toBeNull();
  });
});

describe('minute storage', () => {
  it('writes minutes and reads them back as a snapshot for the reports', async () => {
    const d = fresh();
    await d.sessions.put({
      id: 's',
      date: '2026-10-27',
      start: '09:00',
      startedAt: 1,
      endedAt: null,
      model: 'heuristic',
      device: 'Cam',
    });
    await writeMinutes(d, [
      {
        sessionId: 's',
        day: '2026-10-27',
        minute: 540,
        good_s: 50,
        drift_s: 10,
        absent_s: 0,
        unknown_s: 0,
        dominant: 'upright',
      },
    ]);
    const snap = await readSnapshot(d, new Date(2026, 9, 27, 12));
    expect(snap.demo).toBe(false);
    expect(snap.today).toBe('2026-10-27');
    expect(snap.buckets).toHaveLength(1);
    expect(snap.buckets[0]).not.toHaveProperty('id');
    expect(snap.sessions[0]).toMatchObject({ id: 's', start: '09:00' });
  });
});
