import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { designTokens } from '../design';
import { drawCanvasFrame } from './canvas-renderer';
import type { PoseFixture } from './geometry';
import { buildFrame, type Frame } from './scene';
import { WebGLOverlay, webglAvailable } from './webgl-renderer';

export type RendererChoice = 'auto' | 'webgl' | 'canvas';

interface GoldenOutlineProps {
  fixture: PoseFixture;
  /** Target match strength 0..1; the drawn value follows it on the critically damped "gentle" spring. */
  match: number;
  label: string;
  renderer?: RendererChoice;
  /** Forces reduced motion on or off; by default the system setting decides. */
  reducedMotion?: boolean;
  /** Keep the drawn buffer readable (pixel tests and screenshots only; it costs GPU time). */
  preserveDrawingBuffer?: boolean;
  className?: string;
}

const AT_REST = 0.001;

/**
 * The signature moment: the calibrated outline and the body-edge glow over the darkened image.
 * WebGL with bloom when available, otherwise the 2D fallback with the same meaning.
 *
 * Cost control for an always-on view: at most `glow.max_fps` frames a second; the scene is rebuilt
 * only when the match or size changes; drawing stops when the view is off screen or the tab is
 * hidden, and entirely once settled under reduced motion.
 */
export function GoldenOutline({
  fixture,
  match,
  label,
  renderer = 'auto',
  reducedMotion,
  preserveDrawingBuffer = false,
  className,
}: GoldenOutlineProps) {
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion ?? Boolean(systemReduced);
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(match);
  const [used, setUsed] = useState<'webgl' | 'canvas' | null>(null);
  const [settled, setSettled] = useState<number | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // The overlay may live in the sentinel's Picture-in-Picture window: use that window's document,
    // frame clock and visibility, not the opener's (which is hidden while Nour codes).
    const doc = el.ownerDocument;
    const view = doc.defaultView ?? window;
    const canvas = doc.createElement('canvas');
    canvas.className = 'block size-full';
    canvas.setAttribute('aria-hidden', 'true');
    el.replaceChildren(canvas);

    const wantGl = renderer === 'webgl' || (renderer === 'auto' && webglAvailable());
    let gl: WebGLOverlay | null = null;
    if (wantGl) {
      try {
        gl = new WebGLOverlay(canvas, { preserveDrawingBuffer });
      } catch {
        gl = null;
      }
    }
    const ctx = gl ? null : canvas.getContext('2d');
    setUsed(gl ? 'webgl' : 'canvas');

    const { glow, motion } = designTokens;
    const { stiffness, damping, mass } = motion.springs.gentle;
    const minFrameMs = 1000 / glow.max_fps;
    let m = target.current;
    let velocity = 0;
    let last = performance.now();
    let lastDraw = -Infinity;
    let raf = 0;
    let onScreen = true;
    let reported = Number.NaN;
    let built: { m: number; w: number; h: number; dpr: number } | null = null;
    let frame: Frame | null = null;

    const schedule = () => {
      if (!raf && onScreen && !doc.hidden) raf = view.requestAnimationFrame(tick);
    };

    function tick(now: number) {
      raf = 0;
      if (now - lastDraw < minFrameMs) {
        schedule();
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      lastDraw = now;
      if (reduced) {
        m = target.current;
        velocity = 0;
      } else {
        velocity += ((-stiffness * (m - target.current) - damping * velocity) / mass) * dt;
        m += velocity * dt;
      }
      const w = el?.clientWidth || 1;
      const h = el?.clientHeight || 1;
      const dpr = Math.min(glow.max_dpr, view.devicePixelRatio || 1);
      const shown = Math.min(1, Math.max(0, m));
      const resized = !built || built.w !== w || built.h !== h || built.dpr !== dpr;
      if (resized || Math.abs((built?.m ?? -1) - shown) > AT_REST / 10) {
        frame = buildFrame(fixture, shown, w, h);
        if (gl) {
          gl.resize(w, h, dpr);
          gl.setFrame(frame, reduced);
        } else if (resized) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        built = { m: shown, w, h, dpr };
      }
      if (gl) gl.draw(now, reduced);
      else if (ctx && frame)
        drawCanvasFrame(ctx, frame, reduced ? 0 : (now / 1000) * glow.dash_speed_px_s);

      const atRest = Math.abs(m - target.current) < AT_REST && Math.abs(velocity) < AT_REST;
      if (atRest && reported !== target.current) {
        reported = target.current;
        setSettled(target.current);
      }
      // With reduced motion nothing moves on its own once settled, so drawing stops until woken.
      if (!(reduced && atRest)) schedule();
    }

    const wake = () => {
      last = performance.now();
      schedule();
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) wake();
    });
    io.observe(el);
    const onVisibility = () => {
      if (!doc.hidden) wake();
    };
    doc.addEventListener('visibilitychange', onVisibility);
    el.addEventListener('jr-wake', wake);
    wake();

    return () => {
      view.cancelAnimationFrame(raf);
      io.disconnect();
      doc.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('jr-wake', wake);
      gl?.dispose();
    };
  }, [fixture, renderer, reduced, preserveDrawingBuffer]);

  useEffect(() => {
    target.current = match;
    host.current?.dispatchEvent(new Event('jr-wake'));
  }, [match]);

  return (
    <div
      role="img"
      aria-label={label}
      data-renderer={used ?? undefined}
      data-settled-match={settled ?? undefined}
      data-reduced-motion={reduced ? 'true' : 'false'}
      className={className}
    >
      <div ref={host} className="size-full" />
    </div>
  );
}
