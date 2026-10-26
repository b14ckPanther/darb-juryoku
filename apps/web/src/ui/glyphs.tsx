import { ICON_STROKE } from './button';

export type PostureClass = 'upright' | 'slouch' | 'forward_head' | 'lean_side';

// Custom posture glyphs drawn on Lucide's 24 px grid with its stroke width, round caps and joins,
// so they sit beside Lucide icons as one set. Seen from the side, except the lean (from the front).
const paths: Record<PostureClass, string[]> = {
  upright: ['M12 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z', 'M12 9.5v7', 'M12 16.5h4.5v4', 'M7 20.5h11'],
  slouch: [
    'M14.2 5a2 2 0 1 1-.1 4 2 2 0 0 1 .1-4Z',
    'M13 10.5c-1.8 1.4-2.6 3.4-2 6',
    'M11 16.5h4.5v4',
    'M7 20.5h11',
  ],
  forward_head: [
    'M16.5 4.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
    'M15 9.5 12 11v5.5',
    'M12 16.5h4.5v4',
    'M7 20.5h11',
  ],
  lean_side: [
    'M9.6 4a2 2 0 1 1 .2 4 2 2 0 0 1-.2-4Z',
    'M10.6 9.4 12 16.5',
    'M7 16.5h10',
    'M7 20.5h10',
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
