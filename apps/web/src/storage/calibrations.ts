import type { JuryokuDb, StoredCalibration } from './db';

/** Saves a calibration and makes it the one in use. */
export async function saveCalibration(d: JuryokuDb, c: Omit<StoredCalibration, 'active'>) {
  await d.transaction('rw', d.calibrations, async () => {
    await d.calibrations.toCollection().modify({ active: false });
    await d.calibrations.put({ ...c, active: true });
  });
}

export async function selectCalibration(d: JuryokuDb, id: string) {
  await d.transaction('rw', d.calibrations, async () => {
    await d.calibrations.toCollection().modify((c) => {
      c.active = c.id === id;
    });
  });
}

export const activeCalibration = async (d: JuryokuDb) =>
  (await d.calibrations.toArray()).find((c) => c.active) ?? null;

export const listCalibrations = (d: JuryokuDb) => d.calibrations.orderBy('createdAt').toArray();

export async function deleteEverything(d: JuryokuDb) {
  await Promise.all([d.calibrations.clear(), d.sessions.clear(), d.minutes.clear()]);
}
