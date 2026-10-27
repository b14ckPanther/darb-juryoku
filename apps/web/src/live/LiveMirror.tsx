import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLive } from '../app/live';
import { featuresConfig, poseConfig } from '../config/posture';
import { copy } from '../copy';
import { poseFixture } from '../demo/pose';
import { GoldenOutline } from '../overlay/GoldenOutline';
import { poseFromLandmarks } from '../overlay/from-landmarks';
import type { Landmarks } from '../posture/features';
import { cx } from '../ui/cx';
import { PostureGlyph, type PostureClass } from '../ui/glyphs';

/** The live camera image: mirrored like a mirror, darkened by config/pose.yaml's backdrop. */
export function CameraVideo({ stream, className }: { stream: MediaStream; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.srcObject = stream;
    // Autoplay of a muted inline video is allowed; some environments return no promise.
    void Promise.resolve(v.play()).catch(() => undefined);
    return () => {
      v.srcObject = null;
    };
  }, [stream]);
  const { brightness, saturate } = poseConfig.backdrop;
  return (
    <video
      ref={ref}
      muted
      playsInline
      aria-hidden
      className={cx('absolute inset-0 size-full -scale-x-100 object-cover', className)}
      style={{ filter: `brightness(${brightness}) saturate(${saturate})` }}
    />
  );
}

interface LiveMirrorProps {
  /** The calibrated ideal, as landmarks; null shows the camera only. */
  ideal: Landmarks | null;
  state?: { word: string; posture: PostureClass; good: boolean } | null;
  size?: 'full' | 'mini';
  announce?: boolean;
  children?: ReactNode;
}

/** The golden outline over the live camera: the calibrated outline still, the body rim moving with you. */
export function LiveMirror({ ideal, state, size = 'full', announce, children }: LiveMirrorProps) {
  const live = useLive();
  const mini = size === 'mini';
  const idealPose = useMemo(
    () => (ideal ? poseFromLandmarks(ideal, featuresConfig.landmarks, poseConfig.outline) : null),
    [ideal],
  );
  const body = live.step?.body ?? null;
  const overlay = useMemo(
    () => (idealPose && body ? { ideal: idealPose, body } : null),
    [idealPose, body],
  );
  return (
    <div
      data-theme="dark"
      data-camera={live.camera.kind}
      data-pose={live.pose.kind}
      data-state={live.step?.state ?? ''}
      className={cx(
        'relative overflow-hidden bg-surface text-text',
        mini ? 'size-full' : 'aspect-[4/3] w-full rounded-mirror shadow-raised',
      )}
    >
      {live.stream && <CameraVideo stream={live.stream} />}
      {overlay && (
        <GoldenOutline
          fixture={poseFixture}
          live={overlay}
          match={live.step?.match ?? 1}
          label={copy.live.video_label}
          renderer="canvas"
          className="absolute inset-0"
        />
      )}
      {children}
      {state && (
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
              state.good ? 'text-accent-text' : 'text-drift-text',
            )}
          >
            <PostureGlyph posture={state.posture} size={mini ? 18 : 28} />
            {state.word}
          </p>
        </div>
      )}
    </div>
  );
}
