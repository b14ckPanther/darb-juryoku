import type { Copy } from '../copy';
import type { LiveState } from '../posture/session';
import type { PostureClass } from '../ui/glyphs';

/** The word, glyph and tone for a live state from the session engine. */
export function describeLive(state: LiveState, paused: boolean, copy: Copy) {
  if (paused) return { word: copy.posture.paused, posture: 'upright' as PostureClass, good: false };
  if (state === 'absent')
    return { word: copy.posture.absent, posture: 'upright' as PostureClass, good: false };
  return { word: copy.posture[state], posture: state as PostureClass, good: state === 'upright' };
}
