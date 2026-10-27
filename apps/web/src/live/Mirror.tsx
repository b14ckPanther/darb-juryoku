import { poseFixture } from '../demo/pose';
import { GoldenOutline } from '../overlay/GoldenOutline';
import { cx } from '../ui/cx';
import { PostureGlyph, type PostureClass } from '../ui/glyphs';

interface MirrorProps {
  match: number;
  label: string;
  state: string;
  posture: PostureClass;
  good: boolean;
  /** Small text at the right of the status line, for example the session tally. */
  aside?: { label: string; value: string };
  size?: 'full' | 'mini';
  /** Announce state changes politely (only one mirror on a page should). */
  announce?: boolean;
}

/**
 * The live mirror: the darkened image, the golden outline, the monitor's corner marks echoing the
 * camera frame in the brand mark (ADR-031), and one quiet status line. Always on the dark roles,
 * because the camera image is always dark.
 */
export function Mirror({
  match,
  label,
  state,
  posture,
  good,
  aside,
  size = 'full',
  announce,
}: MirrorProps) {
  const mini = size === 'mini';
  return (
    <div
      data-theme="dark"
      className={cx(
        'relative overflow-hidden bg-surface text-text',
        mini ? 'size-full' : 'aspect-[4/3] w-full rounded-mirror shadow-raised',
      )}
    >
      <GoldenOutline
        fixture={poseFixture}
        match={match}
        label={label}
        className="absolute inset-0"
      />
      <svg
        aria-hidden
        viewBox="0 0 100 75"
        preserveAspectRatio="none"
        className={cx(
          'pointer-events-none absolute text-outline-ideal/60',
          mini ? 'inset-2 size-[calc(100%-1rem)]' : 'inset-4 size-[calc(100%-2rem)]',
        )}
      >
        {['M0 7V0H7', 'M93 0H100V7', 'M100 68V75H93', 'M7 75H0V68'].map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div
        className={cx(
          'absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-surface/90 to-transparent',
          mini ? 'px-2.5 pt-6 pb-2' : 'px-8 pt-14 pb-7',
        )}
      >
        <p
          aria-live={announce ? 'polite' : undefined}
          className={cx(
            'm-0 flex items-center gap-2 font-display',
            mini ? 'text-subhead' : 'text-title1',
            good ? 'text-accent-text' : 'text-drift-text',
          )}
        >
          <PostureGlyph posture={posture} size={mini ? 18 : 28} />
          {state}
        </p>
        {aside && !mini && (
          <p className="num m-0 text-right text-footnote text-text-secondary">
            {aside.label}
            <br />
            <span className="text-subhead text-text">{aside.value}</span>
          </p>
        )}
      </div>
    </div>
  );
}
