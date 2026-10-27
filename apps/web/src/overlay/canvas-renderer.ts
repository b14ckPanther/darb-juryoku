import { designTokens } from '../design';
import { paintBackdrop, type Frame } from './scene';

const rgb = ([r, g, b]: [number, number, number]) =>
  `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;

/** The 2D fallback: same outline, rim and warmth, with a canvas shadow standing in for bloom. */
export function drawCanvasFrame(ctx: CanvasRenderingContext2D, frame: Frame, dashOffset: number) {
  const { outline_width_px, outline_opacity, outline_dash, rim_width_px, rim_blur_px } =
    designTokens.glow;
  const dpr = ctx.canvas.width / frame.width;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paintBackdrop(ctx, frame);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Rim on the body edge: gold, brighter and softer-glowing the better the match.
  ctx.lineWidth = rim_width_px;
  ctx.strokeStyle = rgb(frame.rimColour);
  ctx.shadowColor = rgb(frame.rimColour);
  ctx.shadowBlur = rim_blur_px * frame.intensity;
  ctx.globalAlpha = Math.max(0.08, frame.intensity);
  ctx.beginPath();
  frame.body.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  // The ideal outline from calibration: thin, dashed, never moves. Drawn segment by segment so the
  // parts nearest the drift can warm on their own; the dash offset follows the running length.
  ctx.shadowBlur = 0;
  ctx.globalAlpha = outline_opacity;
  ctx.lineWidth = outline_width_px;
  ctx.setLineDash(outline_dash);
  let run = 0;
  for (let i = 1; i < frame.ideal.length; i++) {
    const a = frame.ideal[i - 1];
    const b = frame.ideal[i];
    const colour = frame.idealColours[i];
    if (!a || !b || !colour) continue;
    ctx.strokeStyle = rgb(colour);
    ctx.lineDashOffset = -dashOffset + run;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    run += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  ctx.restore();
}
