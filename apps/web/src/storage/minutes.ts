import type { DataSnapshot } from '../data/types';
import { localDate } from '../data/source';
import type { MinuteBucket } from '../report/types';
import type { JuryokuDb } from './db';

export async function writeMinutes(d: JuryokuDb, minutes: MinuteBucket[]) {
  if (minutes.length) await d.minutes.bulkAdd(minutes.map((m) => ({ ...m })));
}

/** Real-mode data for the reports: every stored minute and session (no library until Phase 7). */
export async function readSnapshot(d: JuryokuDb, now: Date): Promise<DataSnapshot> {
  const [minutes, sessions] = await Promise.all([d.minutes.toArray(), d.sessions.toArray()]);
  return {
    demo: false,
    today: localDate(now),
    buckets: minutes.map((m) => ({
      sessionId: m.sessionId,
      day: m.day,
      minute: m.minute,
      good_s: m.good_s,
      drift_s: m.drift_s,
      absent_s: m.absent_s,
      unknown_s: m.unknown_s,
      dominant: m.dominant,
    })),
    sessions: sessions.map(({ id, date, start, model, device }) => ({
      id,
      date,
      start,
      model,
      device,
    })),
    library: null,
  };
}
