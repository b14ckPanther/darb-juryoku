import rawTokens from '../../../../config/design/tokens.yaml?raw';
import brand from '../../../../brand/src/tokens.json';
import { parseDesignTokens, type Spring } from './tokens/load-tokens';

/** The design tokens the app runs with, validated at load (config/design/tokens.yaml). */
export const designTokens = parseDesignTokens(rawTokens, brand, 'config/design/tokens.yaml');

export type SpringName = 'settle' | 'snappy' | 'gentle';

/** A Motion transition for a named spring token; reduced motion swaps it for a short fade. */
export function springTransition(name: SpringName, reducedMotion: boolean | null) {
  if (reducedMotion) return { duration: designTokens.motion.durations_ms.reduced_fade / 1000 };
  const s: Spring = designTokens.motion.springs[name];
  return { type: 'spring' as const, stiffness: s.stiffness, damping: s.damping, mass: s.mass };
}
