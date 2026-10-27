// The data the report engine reads. Phase 8 fills it from the session engine; the demo fills it from
// config/seed/demo/sessions.yaml. Days are local calendar dates ('2026-10-26') and minutes count from
// local midnight, so nothing here depends on the time zone.

export type PostureClass = 'upright' | 'slouch' | 'forward_head' | 'lean_side';
export type MinuteState = PostureClass | 'absent' | 'unknown';
export type DriftClass = Exclude<PostureClass, 'upright'>;

export const DRIFT_CLASSES: readonly DriftClass[] = ['slouch', 'forward_head', 'lean_side'];
export const isDrift = (s: MinuteState): s is DriftClass => (DRIFT_CLASSES as string[]).includes(s);

/** One minute of one session: seconds in each state and the state that held most of it. */
export interface MinuteBucket {
  sessionId: string;
  day: string;
  minute: number;
  good_s: number;
  drift_s: number;
  absent_s: number;
  unknown_s: number;
  dominant: MinuteState;
}

export interface SessionMeta {
  id: string;
  date: string;
  start: string;
  model: string;
  device: string;
}
