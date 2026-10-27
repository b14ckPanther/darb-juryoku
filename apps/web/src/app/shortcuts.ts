export type ShortcutAction = 'pause' | 'calibrate' | 'sentinel' | 'help';

interface KeyLike {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  /** The element the key went to. */
  target: {
    tagName?: string;
    isContentEditable?: boolean;
    getAttribute?(n: string): string | null;
  } | null;
}

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
// Space presses a focused button, link or switch natively, so it only pauses from elsewhere.
const PRESSABLE = new Set(['BUTTON', 'A', 'SUMMARY']);

/** The app shortcut a key press asks for, or null. Never while typing or with a modifier key. */
export function shortcutFor(
  e: KeyLike,
  keys: Record<ShortcutAction, string>,
): ShortcutAction | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const tag = e.target?.tagName ?? '';
  if (TYPING.has(tag) || e.target?.isContentEditable) return null;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const hit = (Object.keys(keys) as ShortcutAction[]).find((a) => keys[a].toLowerCase() === key);
  if (!hit) return null;
  if (hit === 'pause' && (PRESSABLE.has(tag) || e.target?.getAttribute?.('role') === 'radio'))
    return null;
  return hit;
}
