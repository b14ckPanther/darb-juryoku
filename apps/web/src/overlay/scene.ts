import { designTokens } from '../design';
import { resolveScope } from '../design/tokens/load-tokens';
import {
  catmullRom,
  contour,
  mixPose,
  rimIntensity,
  segmentWarmth,
  type Point,
  type Pose,
  type PoseFixture,
} from './geometry';

// Everything both renderers need for one frame, derived from the pose fixture, match strength and tokens.
// The overlay always sits on the darkened camera image, so it uses the dark theme's roles.
const roles = resolveScope(designTokens, 'theme:dark');
const hex = (role: string) => roles[role]?.hex ?? '#000000';

export const overlayColours = {
  backdrop: hex('surface'),
  body: hex('surface_overlay'),
  bodyEdge: hex('surface_raised'),
  ideal: hex('outline_ideal'),
  rim: hex('accent'),
  drift: hex('drift'),
};

export const SAMPLES_PER_SPAN = 10;

export interface Frame {
  width: number;
  height: number;
  ideal: Point[];
  body: Point[];
  /** Ideal-outline colour per point: the calibrated line warms toward drift where the body moved most. */
  idealColours: [number, number, number][];
  rimColour: [number, number, number];
  intensity: number;
  matchMoment: boolean;
}

export const toRgb = (h: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

/** One frame of the overlay. `body` replaces the fixture's mixed pose with a live one. */
export function buildFrame(
  fixture: PoseFixture,
  m: number,
  width: number,
  height: number,
  livePose?: Pose,
): Frame {
  const { drift_warm_from, match_moment_from } = designTokens.glow;
  const ideal = catmullRom(contour(fixture, fixture.ideal, width, height), SAMPLES_PER_SPAN);
  const body = catmullRom(
    contour(fixture, livePose ?? mixPose(fixture, 1 - m), width, height),
    SAMPLES_PER_SPAN,
  );
  const warmth = segmentWarmth(fixture, m, drift_warm_from);
  const base = toRgb(overlayColours.ideal);
  const drift = toRgb(overlayColours.drift);
  const idealColours = ideal.map((_, i) => {
    const span = i / SAMPLES_PER_SPAN;
    const a = warmth[Math.floor(span)] ?? 0;
    const b = warmth[Math.min(warmth.length - 1, Math.ceil(span))] ?? 0;
    const w = a + (b - a) * (span - Math.floor(span));
    return base.map((c, k) => c + ((drift[k] ?? 0) - c) * w) as [number, number, number];
  });
  return {
    width,
    height,
    ideal,
    body,
    idealColours,
    rimColour: toRgb(overlayColours.rim),
    intensity: rimIntensity(m),
    matchMoment: m >= match_moment_from,
  };
}

/**
 * Paints the stand-in for the darkened camera image: a dim room and a synthetic figure filled from the
 * body contour down to the bottom edge. No photo of a person is used anywhere.
 */
export function paintBackdrop(ctx: CanvasRenderingContext2D, frame: Frame) {
  const { width: w, height: h, body } = frame;
  const room = ctx.createRadialGradient(w * 0.5, h * 1.05, h * 0.1, w * 0.5, h * 0.6, h * 1.1);
  room.addColorStop(0, overlayColours.bodyEdge);
  room.addColorStop(1, overlayColours.backdrop);
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, w, h);

  const first = body[0];
  const last = body[body.length - 1];
  if (!first || !last) return;
  ctx.beginPath();
  ctx.moveTo(first[0], h);
  for (const [x, y] of body) ctx.lineTo(x, y);
  ctx.lineTo(last[0], h);
  ctx.closePath();
  const figure = ctx.createLinearGradient(0, h * 0.15, 0, h);
  figure.addColorStop(0, overlayColours.body);
  figure.addColorStop(1, overlayColours.bodyEdge);
  ctx.fillStyle = figure;
  ctx.fill();
}
