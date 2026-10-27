import { Pause, PictureInPicture2 } from 'lucide-react';
import { designSeed, poseFixture } from '../../demo/seed';
import { GoldenOutline, type RendererChoice } from '../../overlay/GoldenOutline';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';

interface MirrorPanelProps {
  match: number;
  frameMarks?: boolean;
  scanGrid?: boolean;
  renderer?: RendererChoice;
  reducedMotion?: boolean;
  preserveDrawingBuffer?: boolean;
  compact?: boolean;
}

/** The live mirror: darkened image, golden outline, one quiet status line and the session actions. */
export function MirrorPanel({
  match,
  frameMarks,
  scanGrid,
  renderer = 'auto',
  reducedMotion,
  preserveDrawingBuffer,
  compact,
}: MirrorPanelProps) {
  const { mirror } = designSeed;
  const state =
    match >= mirror.state_from.upright
      ? mirror.states.upright
      : match >= mirror.state_from.drifting
        ? mirror.states.drifting
        : mirror.states.forward_head;
  const good = match >= mirror.state_from.upright;
  return (
    <div className="grid gap-3">
      {/* The camera image is always dark, so the mirror uses the dark roles in every theme and direction. */}
      <div
        data-theme="dark"
        className="relative aspect-[4/3] overflow-hidden rounded-mirror bg-surface text-text shadow-raised"
      >
        <GoldenOutline
          fixture={poseFixture}
          match={match}
          label={mirror.image_label}
          renderer={renderer}
          reducedMotion={reducedMotion}
          preserveDrawingBuffer={preserveDrawingBuffer}
          className="absolute inset-0"
        />
        {scanGrid && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--accent) 16%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent) 1px, transparent 1px)',
              backgroundSize: '12.5% 16.667%',
            }}
          />
        )}
        {frameMarks && (
          <svg
            aria-hidden
            viewBox="0 0 100 75"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-3 size-[calc(100%-1.5rem)] text-outline-ideal/70"
          >
            {['M0 8V0H8', 'M92 0H100V8', 'M100 67V75H92', 'M8 75H0V67'].map((d) => (
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
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-surface/85 to-transparent px-4 pt-10 pb-3">
          <p
            aria-live={compact ? undefined : 'polite'}
            className={cx(
              'm-0 font-display',
              compact ? 'text-title3' : 'text-title1',
              good ? 'text-accent-text' : 'text-drift-text',
            )}
          >
            {state}
          </p>
          <p className="num m-0 text-right text-footnote text-text-secondary">
            {mirror.session_label}
            <br />
            <span className="text-text">{mirror.session_value}</span>
          </p>
        </div>
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <Button icon={PictureInPicture2}>{mirror.open_sentinel}</Button>
          <Button variant="quiet" icon={Pause}>
            {mirror.pause}
          </Button>
        </div>
      )}
    </div>
  );
}
