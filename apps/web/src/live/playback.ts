import type { Playback } from '../data/types';

/** Demo playback: the match at `seconds`, eased between keys with smoothstep, looping. */
export function matchAt(p: Playback, seconds: number): number {
  const n = p.match.length;
  const pos = (((seconds / p.seconds_per_key) % n) + n) % n;
  const i = Math.floor(pos);
  const f = pos - i;
  const a = p.match[i] ?? 0;
  const b = p.match[(i + 1) % n] ?? a;
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
}

export type LiveState = 'upright' | 'drift';

export const stateFor = (p: Playback, match: number): LiveState =>
  match >= p.state_from.upright ? 'upright' : 'drift';
