import { ICON_STROKE } from './button';

export type PostureClass = 'upright' | 'slouch' | 'forward_head' | 'lean_side';

// Custom posture glyphs drawn on Lucide's 24 px grid with its stroke width, round caps and joins,
// so they sit beside Lucide icons as one set. A seated figure seen from the side (head, back, thigh,
// shin, chair back), except the lean, seen from the front.
const paths: Record<PostureClass, string[]> = {
  upright: [
    'M10 2.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z',
    'M10 8.5v6.5',
    'M10 15h6.5v6',
    'M6.5 9v12',
  ],
  slouch: [
    'M13.5 4.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z',
    'M12.5 10.5C9.5 11.5 8.5 13 9 15',
    'M9 15h7.5v6',
    'M6.5 9v12',
  ],
  forward_head: [
    'M15.5 3.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z',
    'M10 9.5l3.5-2',
    'M10 9.5V15',
    'M10 15h6.5v6',
    'M6.5 9v12',
  ],
  lean_side: [
    'M9 2.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z',
    'M9.8 8.5 12 15',
    'M7.5 15h9',
    'M8.5 15v6M15.5 15v6',
  ],
};

export function PostureGlyph({
  posture,
  label,
  size = 24,
}: {
  posture: PostureClass;
  label?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {paths[posture].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
