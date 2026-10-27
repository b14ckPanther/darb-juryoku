// On-device storage (IndexedDB through Dexie). Landmarks of the calibrated ideal pose and minute
// totals only: never frames, never a landmark stream (agent manual 1.3).
import Dexie, { type EntityTable } from 'dexie';
import type { BaseFeatures, Landmarks } from '../posture/features';
import type { MinuteBucket } from '../report/types';

export interface StoredCalibration {
  id: string;
  name: string;
  camera: string;
  /** Local date, for the list. */
  created: string;
  createdAt: number;
  /** Median landmarks over the hold. */
  landmarks: Landmarks;
  /** Base features of that ideal pose, the reference for every delta. */
  features: BaseFeatures;
  /** Width over height of the frames it was taken from. */
  aspect: number;
  /** Hash of config/features.yaml when it was taken; another hash means calibrate again. */
  featuresHash: string;
  active: boolean;
}

export interface StoredSession {
  id: string;
  date: string;
  start: string;
  startedAt: number;
  endedAt: number | null;
  model: string;
  device: string;
}

export type StoredMinute = MinuteBucket & { id?: number };

export class JuryokuDb extends Dexie {
  calibrations!: EntityTable<StoredCalibration, 'id'>;
  sessions!: EntityTable<StoredSession, 'id'>;
  minutes!: EntityTable<StoredMinute, 'id'>;

  constructor(name = 'darb-juryoku') {
    super(name);
    this.version(1).stores({
      calibrations: 'id, createdAt, active',
      sessions: 'id, startedAt',
      minutes: '++id, sessionId, day, [day+minute]',
    });
  }
}

let shared: JuryokuDb | null = null;
export const db = () => (shared ??= new JuryokuDb());
