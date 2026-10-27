import type { Copy } from '../copy';
import type { Playback } from '../data/types';
import type { PostureClass } from '../ui/glyphs';
import { stateFor } from './playback';

/** What the mirror says for a match: the word, the glyph and whether it is the good state. */
export function describeMatch(
  playback: Playback,
  match: number,
  paused: boolean,
  copy: Copy,
): { word: string; posture: PostureClass; good: boolean } {
  if (paused) return { word: copy.posture.paused, posture: 'upright', good: false };
  return stateFor(playback, match) === 'upright'
    ? { word: copy.posture.upright, posture: 'upright', good: true }
    : { word: copy.posture[playback.drift_class], posture: playback.drift_class, good: false };
}
